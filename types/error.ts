export enum ErrorType {
  NETWORK_ERROR = "NETWORK",
  AUTHENTICATION = "AUTHENTICATION",
  VALIDATION = "VALIDATION",
  SERVER = "SERVER",
  UNKNOWN = "UNKNOWN",
  // HabitLog固有のエラータイプを追加
  HABIT_LOG_FETCH = "HABIT_LOG_FETCH",
  HABIT_LOG_UPDATE = "HABIT_LOG_UPDATE",
  HABIT_LOG_SUBSCRIPTION = "HABIT_LOG_SUBSCRIPTION",
}

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: any;
}

export interface PostgrestErrorType {
  code: string;
  message: string;
  details: string;
  hint?: string;
}
