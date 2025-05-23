import type { RealtimeChannel } from "@supabase/supabase-js";
import {
	addDays,
	endOfWeek,
	format,
	set,
	startOfWeek,
	subDays,
} from "date-fns";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../libs/supabase";
import type { Database } from "../types/schema";
import { AppError, ErrorType } from "../types/error";

type HabitLog = Database["public"]["Tables"]["habit_logs"]["Row"];
type AppHabitLog = Omit<HabitLog, "updated_at" | "created_at">;

interface UpdateLogProps {
	logID?: string;
	habitID: string;
	date: Date;
	status: "achieved" | "not_achieved";
	notes: string;
}

interface UseHabitLogsSubscriptionProps {
	habitId: string;
	_currentDate: Date;
	onError?: (error: Error) => void;
}

export const useHabitLogsSubscription = ({
	habitId,
	_currentDate,
	onError,
}: UseHabitLogsSubscriptionProps) => {
	const [logs, setLogs] = useState<AppHabitLog[]>([]);
	const [isInitialLoading, setIsInitialLoading] = useState(true);
	const [updatingDates, setUpdatingDates] = useState<Set<string>>(new Set());
	const [error, setError] = useState<AppError | null>(null);

	const [currentDate, setCurrentDate] = useState(_currentDate);
	useEffect(() => {
		setCurrentDate(_currentDate);
	}, [_currentDate]);

	const [subscription, setSubscription] = useState<RealtimeChannel | null>(
		null,
	);

	const startDateStr = format(subDays(currentDate, 6), "yyyy-MM-dd");
	const endDateStr = format(currentDate, "yyyy-MM-dd");

	const handleError = useCallback((error: any, type: ErrorType): AppError => {
		const appError: AppError = {
			type,
			message: "予期せぬエラーが発生しました",
			originalError: error,
		};

		if (error && "code" in error) {
			switch (error.code) {
				case "PGRST301":
					appError.type = ErrorType.AUTHENTICATION;
					appError.message = "認証エラーが発生しました";
					break;
				case "ERR_NETWORK":
					appError.type = ErrorType.NETWORK_ERROR;
					appError.message = "ネットワーク接続を確認してください";
					break;
			}
		}

		onError?.(error instanceof Error ? error : new Error(appError.message));
		setError(appError);
		return appError;
	}, [onError]);

	const fetchLogs = useCallback(async () => {
		try {
			setIsInitialLoading(true);

			const { data, error } = await supabase
				.from("habit_logs")
				.select(`
          id,
          habit_id,
					date,
          status,
          notes
        `)
				.eq("habit_id", habitId) // 対象のhabit_idでフィルタリング
				.gte("date", startDateStr)
				.lte("date", endDateStr)
				.order("date", { ascending: true });

			if (error) {
				handleError(error, ErrorType.HABIT_LOG_FETCH);
				return null;
			}
			const organizedLogs: AppHabitLog[] = Array.from(
				{ length: 7 },
				(_, index) => {
					const date = format(addDays(startDateStr, index), "yyyy-MM-dd");
					const log = data?.find(
						(log) => format(new Date(log.date), "yyyy-MM-dd") === date,
					);

					return (
						log || {
							id: undefined,
							habit_id: habitId,
							date: date,
							status: "unchecked",
							notes: "",
						}
					);
				},
			);

			setLogs(organizedLogs);
			setError(null);
		} catch (error) {
			return null;
		} finally {
			setIsInitialLoading(false);
		}
		// ここ依存直すと動かなくなる
	}, [habitId, currentDate]);

	useEffect(() => {
		let mounted = true;

		const setupSubscription = async () => {
			// 既存のサブスクリプションをクリーンアップ
			if (subscription) {
				subscription.unsubscribe();
			}

			// 初回データの取得
			if (mounted) {
				await fetchLogs();
			}

			// リアルタイム更新の購読
			const newSubscription = supabase
				.channel(`habit-logs-${habitId}`)
				.on(
					"postgres_changes",
					{
						event: "*",
						schema: "public",
						table: "habit_logs",
						filter: `habit_id=eq.${habitId}`,
					},
					async () => {
						if (mounted) {
							await fetchLogs();
						}
					},
				)
				.subscribe();

			if (mounted) {
				setSubscription(newSubscription);
			}
		};

		setupSubscription();

		return () => {
			mounted = false;
			if (subscription) {
				subscription.unsubscribe();
			}
		};
		// ここ依存直すと動かなくなる
	}, [habitId, currentDate]);

	const updateLog = async (props: UpdateLogProps) => {
		const { logID, date, status, notes } = props;

		const updatingDate = format(date, "yyyy-MM-dd");

		try {
			// 更新中の日付を記録
			setUpdatingDates((prev) => new Set(prev).add(updatingDate));

			// 楽観的更新
			setLogs((currentLogs) =>
				currentLogs.map((log) =>
					log.date === updatingDate ? { ...log, status, notes } : log
				)
			);

			// ここでid渡ってきてない
			if (logID) {
				const { error } = await supabase
					.from("habit_logs")
					.update({
						status: status,
						notes,
					})
					.eq("id", logID);

				// setLogs(previousLogs);
				if (error) {
					handleError(error, ErrorType.HABIT_LOG_UPDATE);
				}
			} else {
				const { error } = await supabase.from("habit_logs").insert({
					habit_id: habitId,
					date: updatingDate,
					status,
					notes,
				});
				if (error) {
					handleError(error, ErrorType.HABIT_LOG_UPDATE);
				}
			}
		} catch (error) {
			// エラー時は元の状態に戻す
			await fetchLogs();
			handleError(error, ErrorType.HABIT_LOG_UPDATE);
		} finally {
			// 更新中の日付を削除
			setUpdatingDates((prev) => {
				const next = new Set(prev);
				next.delete(updatingDate);
				return next;
			});
		}
	};

	return {
		logs,
		isInitialLoading,
		updatingDates,
		updateLog,
		error,
		retry: fetchLogs,
	};
};
