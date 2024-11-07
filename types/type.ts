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
