import { useEffect, useState } from "react";
import { supabase } from "../libs/supabase";
import type { AppHabitStatistics } from "../types/type";

export const useHabitStatistics = () => {
  const [statistics, setStatistics] = useState<AppHabitStatistics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStatistics = async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from("habit_statistics_view")
        .select("*")
        .order("achievement_rate", { ascending: false });

      if (error) throw error;

      setStatistics(data || []);
    } catch (e) {
      console.error("Error fetching statistics:", e);
      setError(
        e instanceof Error ? e : new Error("Failed to fetch statistics"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  return {
    statistics,
    isLoading,
    error,
    refetch: fetchStatistics,
  };
};
