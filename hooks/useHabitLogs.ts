import { useCallback, useEffect, useState } from "react";
import { supabase } from "../libs/supabase";
import type { Database } from "../types/schema";
import { addDays, endOfWeek, format, startOfWeek, subDays } from "date-fns";

type HabitLog = Database["public"]["Tables"]["habit_logs"]["Row"];
type AppHabitLog = Omit<HabitLog, "updated_at" | "created_at" | "id">;

interface ToggleStatusProps {
	logID?: string;
	habitID: string;
	date: Date;
	status: "achieved" | "not_achieved" | "unchecked";
	notes: string;
}

export const useUpdateLog = (habitID: string | undefined) => {
	const updateLog = async (props: ToggleStatusProps) => {
		const { logID, status, notes, date } = props;
		if (!habitID) return;

		try {
			if (logID) {
				const { error } = await supabase
					.from("habit_logs")
					.update({ status, notes })
					.eq("id", logID);

				if (error) throw error;
			} else {
				const { error } = await supabase.from("habit_logs").insert([
					{
						habit_id: habitID,
						date: date.toDateString(),
						status,
						notes,
					},
				]);

				if (error) throw error;
			}
		} catch (error) {
			return error;
		}
	};

	return { updateLog };
};
