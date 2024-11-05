import { useCallback, useEffect, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../libs/supabase";
import type { Database } from "../types/schema";
import { addDays, endOfWeek, format, startOfWeek, subDays } from "date-fns";

type HabitLog = Database["public"]["Tables"]["habit_logs"]["Row"];
type AppHabitLog = Omit<HabitLog, "updated_at" | "created_at">;


interface UpdateLogProps {
	logID?: string;
	habitID: string;
	date: Date;
	status: "achieved" | "not_achieved" | "unchecked";
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

  const [currentDate, setCurrentDate] = useState(_currentDate);
  useEffect(() => {
    setCurrentDate(_currentDate);
  }, [_currentDate]);

  const [subscription, setSubscription] = useState<RealtimeChannel | null>(
    null,
  );

  const startDateStr = format(subDays(currentDate, 6), "yyyy-MM-dd");
  const endDateStr = format(currentDate, "yyyy-MM-dd");

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
    } catch (error) {
      console.error("Error fetching logs:", error);
      return null;
    } finally {
      setIsInitialLoading(false);
    }
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
  }, [habitId, currentDate]);

  const updateLog = async (props: UpdateLogProps) => {
    const { logID, date, status, notes } = props;
    console.log('updateLog', logID, date, status, notes)
    const updatingDate = format(date, "yyyy-MM-dd");

    try {
      // 更新中の日付を記録
      setUpdatingDates((prev) => new Set(prev).add(updatingDate));

      // 楽観的更新
      setLogs((currentLogs) =>
        currentLogs.map((log) => log.date === updatingDate ? { ...log, status, notes } : log)
      );

      const existingLog = logs.find((log) => log.date === updatingDate);

      if (existingLog?.id) {
        const { error } = await supabase
          .from("habit_logs")
          .update({
            status: status,
            notes,
          })
          .eq("id", existingLog.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("habit_logs")
          .insert({
            habit_id: habitId,
            date: updatingDate,
            status,
            notes
          });

        if (error) throw error;
      }
    } catch (error) {
      // エラー時は元の状態に戻す
      await fetchLogs();
      console.error("Error updating log:", error);
      onError?.(
        error instanceof Error ? error : new Error("Failed to update log"),
      );
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
  };
};
