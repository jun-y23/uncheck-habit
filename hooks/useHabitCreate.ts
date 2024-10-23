import { useState } from "react";
import { supabase } from "../libs/supabase";
import type { Database } from "../types/schema";
import { useSession } from "./useAuth";

type HabitInsert = Database["public"]["Tables"]["habits"]["Insert"];

export function useHabitCreate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { session } = useSession();

  async function createHabit(habit: Omit<HabitInsert, "user_id">) {
    try {
      setLoading(true);
      setError(null);

      if (!session?.user) throw new Error("認証が必要です");
      console.log(session?.user);

      const { data, error } = await supabase
        .from("habits")
        .insert([{ ...habit, user_id: session.user.id }])
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
