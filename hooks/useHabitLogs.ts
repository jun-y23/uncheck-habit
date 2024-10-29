import { useEffect, useState, useCallback } from "react";
import { supabase } from "../libs/supabase";
import type { Database } from "../types/schema";
import { format, startOfWeek, endOfWeek, addDays } from "date-fns";
import type { DateRange } from "@/types/type";

type HabitLog = Database["public"]["Tables"]["habit_logs"]["Row"];

export function useHabitLogs(habitId: string | undefined) {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const getDateRange = useCallback((currentDate: Date): DateRange => {
		const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // 月曜始まり
		const endDate = endOfWeek(currentDate, { weekStartsOn: 1 }); // 日曜終わり
		return { startDate, endDate };
	}, []);

	const fetchLogs = useCallback(
		async (habitId: string, currentDate: Date) => {
			try {
				setLoading(true);
				setError(null);

				const { startDate, endDate } = getDateRange(currentDate);
				const startDateStr = format(startDate, "yyyy-MM-dd");
				const endDateStr = format(endDate, "yyyy-MM-dd");

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

				const organizedLogs: HabitLog[] = Array.from(
					{ length: 7 },
					(_, index) => {
						const date = format(addDays(startDate, index), "yyyy-MM-dd");
						const log = data?.find((log) => log.date === date);

						return (
							log || {
								id: null,
								habit_id: habitId,
								date: date,
								status: "unchecked",
								note: "",
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
		[getDateRange],
	);

	async function toggleStatus(
		date: string,
		status: "achieved" | "not_achieved" | "unchecked",
		notes: string,
	) {
		console.log(date);
		try {
			const existingLog = logs.find((log) => log.date === date);

			if (existingLog) {
				const { error } = await supabase
					.from("habit_logs")
					.update({ status, notes }) // Update status and memo
					.eq("id", existingLog.id);

				if (error) throw error;
			} else {
				const { error } = await supabase.from("habit_logs").insert([
					{
						habit_id: habitId || "", // Ensure habitId is not undefined
						date,
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
