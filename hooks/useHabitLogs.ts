import { useCallback, useEffect, useState } from "react";
import { supabase } from "../libs/supabase";
import type { Database } from "../types/schema";
import { addDays, endOfWeek, format, startOfWeek, subDays } from "date-fns";

type HabitLog = Database["public"]["Tables"]["habit_logs"]["Row"];
type AppHabitLog = Omit<HabitLog, "updated_at" | "created_at" | "id">;

interface ToggleStatusProps {
	logID?: string;
	habitID: string;
	date: Date;
	status: "achieved" | "not_achieved" | "unchecked";
	notes: string;
}

export function useHabitLogs(habitId: string | undefined, _currentDate: Date) {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);
	const [logs, setLogs] = useState<AppHabitLog[] | null>(null);
	const [currentDate, setCurrentDate] = useState(_currentDate);

	const fetchLogs = useCallback(
		async (habitId: string) => {
			try {
				setLoading(true);
				setError(null);

				const startDateStr = format(subDays(currentDate, 6), "yyyy-MM-dd");
				const endDateStr = format(currentDate, "yyyy-MM-dd");

				console.log("startDateStr", startDateStr);
				console.log("endDateStr", endDateStr);

				// habit_logsには登録したひから今日以前のデータしかない
				// データがないをどう返却するか
				// 登録した日から昨日までのデータは存在する（バッチ処理するので）

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
					throw error;
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
								id: null,
								habit_id: habitId,
								date: date,
								status: "unchecked",
								notes: "",
							}
						);
					},
				);

				setLogs(organizedLogs);

				return organizedLogs;
			} catch (err) {
				setError(
					err instanceof Error ? err : new Error("Unknown error occurred"),
				);
				return null;
			} finally {
				setLoading(false);
			}
		},
		[currentDate],
	);

	useEffect(() => {
		if (!habitId) return;

		const subscription = supabase
			.channel("habit_logs_changes")
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "habit_logs",
					filter: `habit_id=eq.${habitId}`,
				},
				async (payload) => {
					await fetchLogs(habitId);
				},
			)
			.subscribe();

		return () => {
			subscription.unsubscribe();
		};
	}, [habitId, currentDate, fetchLogs]);

	useEffect(() => {
		if (habitId) {
			fetchLogs(habitId);
		}
	}, [habitId, currentDate, fetchLogs]);

	async function toggleStatus(props: ToggleStatusProps) {
		const { logID, habitID, date, status, notes } = props;
		try {
			if (logID) {
				const { error } = await supabase
					.from("habit_logs")
					.update({ status, notes })
					.eq("id", logID);

				if (error) throw error;
			} else {
				const { error } = await supabase.from("habit_logs").insert([
					{
						habit_id: habitID,
						date: date.toDateString(),
						status,
						notes,
					},
				]);

				if (error) throw error;
			}
			await fetchLogs(habitID);
		} catch (error) {
			setError(
				error instanceof Error ? error : new Error("Unknown error occurred"),
			);
		}
	}

	return { logs, fetchLogs, loading, error, toggleStatus };
}
