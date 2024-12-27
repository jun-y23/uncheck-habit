import NetInfo from "@react-native-community/netinfo";
import { type AppError, ErrorType, PostgrestErrorType } from "../types/error";

function isPostgrestError(error: any): error is PostgrestErrorType {
  return (
    error &&
    typeof error === "object" &&
    "code" in error &&
    "message" in error &&
    "details" in error
  );
}

export class ErrorHandler {
  static async isNetworkConnected(): Promise<boolean> {
    const networkState = await NetInfo.fetch();
    return networkState.isConnected ?? false;
  }

  static handleError(error: any): AppError {
    if (!error) {
      return {
        type: ErrorType.UNKNOWN,
        message: "不明なエラーが発生しました",
      };
    }

    // ネットワーク接続エラー
    if (
      error.message === "Network request failed" || error.code === "ERR_NETWORK"
    ) {
      return {
        type: ErrorType.NETWORK_ERROR,
        message: "ネットワーク接続を確認してください",
        originalError: error,
      };
    }

    // Supabaseのエラー
    if (isPostgrestError(error)) {
      if (error.code === "PGRST301") {
        return {
          type: ErrorType.AUTHENTICATION,
          message: "認証エラーが発生しました。再度ログインしてください",
          originalError: error,
        };
      }
      // その他のSupabase固有のエラーハンドリング
      return {
        type: ErrorType.SERVER,
        message: "サーバーエラーが発生しました",
        originalError: error,
      };
    }

    return {
      type: ErrorType.UNKNOWN,
      message: "予期せぬエラーが発生しました",
      originalError: error,
    };
  }
}
