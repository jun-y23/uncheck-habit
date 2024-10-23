import { useState } from "react";
import { supabase } from "../libs/supabase";
import type { Database } from "../types/schema";

type HabitInsert = Database["public"]["Tables"]["habits"]["Insert"];

export function useHabitCreate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createHabit(habit: Omit<HabitInsert, "user_id">) {
    try {
      setLoading(true);
      setError(null);

      const user = supabase.auth.user();
      if (!user) throw new Error("認証が必要です");

      const { data, error } = await supabase
        .from("habits")
        .insert([{ ...habit, user_id: user.id }])
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      setError(error instanceof Error ? error.message : "エラーが発生しました");
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { createHabit, loading, error };
}
