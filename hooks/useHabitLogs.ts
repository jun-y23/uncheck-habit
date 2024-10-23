import { useEffect, useState } from "react";
import { supabase } from "../libs/supabase";
import type { Database } from "../types/schema";

type HabitLog = Database["public"]["Tables"]["habit_logs"]["Row"];

export function useHabitLogs(habitId: string) {
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (habitId) {
      fetchLogs();
    }
  }, [habitId]);

  async function fetchLogs() {
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

  async function toggleStatus(date: string) {
    try {
      const existingLog = logs.find((log) => log.date === date);

      if (existingLog) {
        const newStatus = existingLog.status === "achieved"
          ? "not_achieved"
          : "achieved";
        const { error } = await supabase
          .from("habit_logs")
          .update({ status: newStatus })
          .eq("id", existingLog.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("habit_logs")
          .insert([{
            habit_id: habitId,
            date,
            status: "achieved",
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
