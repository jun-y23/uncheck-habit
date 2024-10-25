import { useEffect, useState } from "react";
import { supabase } from "../libs/supabase";
import type { Database } from "../types/schema";

type HabitLog = Database["public"]["Tables"]["habit_logs"]["Row"];

export function useHabitLogs(habitId: string | undefined) {
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (habitId) {
      fetchLogs();
    }
  }, [habitId]);

  async function fetchLogs() {
    if (!habitId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("habit_logs")
        .select("*")
        .eq("habit_id", habitId)
        .order("date", { ascending: false });

      if (error) throw error;
      setLogs(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus(
    date: string,
    status: "achieved" | "not_achieved" | "unchecked",
    notes: string,
  ) {
    try {
      const existingLog = logs.find((log) => log.date === date);

      if (existingLog) {
        const { error } = await supabase
          .from("habit_logs")
          .update({ status, notes }) // Update status and memo
          .eq("id", existingLog.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("habit_logs")
          .insert([{
            habit_id: habitId || "", // Ensure habitId is not undefined
            date,
            status,
            notes,
          }]);

        if (error) throw error;
      }

      await fetchLogs();
    } catch (error) {
      setError(error instanceof Error ? error.message : "エラーが発生しました");
    }
  }

  return { logs, loading, error, toggleStatus, refetch: fetchLogs };
}
