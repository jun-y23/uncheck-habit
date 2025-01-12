import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../libs/supabase";

// RPCを実行する関数
const recalculateStatistics = async () => {
  const { error } = await supabase.rpc("calculate_habit_statistics");
  if (error) throw error;
  return true;
};

// カスタムフック
export const useRecalculateStatistics = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: recalculateStatistics,
    onSuccess: () => {
      // 統計情報のキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ["habit-statistics"] });
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
  });
};
