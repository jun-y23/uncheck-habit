import { QueryClient } from "@tanstack/react-query";

// クライアントの設定
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5分
    },
  },
});
