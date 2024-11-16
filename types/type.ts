import type { Database } from "./schema";

export type Habit = Pick<
	Database["public"]["Tables"]["habits"]["Row"],
	"id" | "name" | "icon"
>;

export interface DateRange {
	startDate: Date;
	endDate: Date;
}

export type NewHabitLog = Pick<
	Database["public"]["Tables"]["habit_logs"]["Row"],
	"habit_id" | "date" | "status" | "notes"
>;

export type AppHabitStatistics = Pick<
	Database["public"]["Views"]["habit_statistics_view"]["Row"],
	| "id"
	| "name"
	| "achieved_days"
	| "achievement_rate"
	| "total_days"
	| "total_days"
	| "achieved_days"
	| "calculated_at"
>;
