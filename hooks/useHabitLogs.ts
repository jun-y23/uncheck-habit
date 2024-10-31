import { useCallback, useEffect, useState } from "react";
import { supabase } from "../libs/supabase";
import type { Database } from "../types/schema";
import { addDays, endOfWeek, format, startOfWeek, subDays } from "date-fns";
import type { DateRange } from "@/types/type";

type HabitLog = Database["public"]["Tables"]["habit_logs"]["Row"];
type AppHabitLog = Omit<HabitLog, "updated_at" | "created_at" | "id">;

interface ToggleStatusProps {
	logID?: string;
	habitID: string;
	date: Date;
	status: "achieved" | "not_achieved" | "unchecked";
	notes: string;
}

export function useHabitLogs(habitId: string | undefined) {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchLogs = useCallback(
		async (habitId: string, currentDate: Date) => {
			try {
				setLoading(true);
				setError(null);

				const startDateStr = format(subDays(currentDate, 6), "yyyy-MM-dd");
				const endDateStr = format(currentDate, "yyyy-MM-dd");

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
						const log = data?.find((log) =>
							format(new Date(log.date), "yyyy-MM-dd") === date
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
		[],
	);

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
		} catch (error) {
			setError(error instanceof Error ? error.message : "エラーが発生しました");
		}
	}

	return { fetchLogs, loading, error, toggleStatus };
}
