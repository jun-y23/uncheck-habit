import { useEffect, useState } from "react";
import { supabase } from "../libs/supabase";
import type { Database } from "../types/schema";

type Habit = Database["public"]["Tables"]["habits"]["Row"];
type HabitInsert = Database["public"]["Tables"]["habits"]["Insert"];
type HabitUpdate = Database["public"]["Tables"]["habits"]["Update"];
type HabitLog = Database["public"]["Tables"]["habit_logs"]["Row"];
type Template = Database["public"]["Tables"]["habit_templates"]["Row"];

export function useHabits() {
	const [habits, setHabits] = useState<Habit[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		fetchHabits();
	}, []);

	async function fetchHabits() {
		try {
			setLoading(true);
			const { data, error } = await supabase
				.from("habits")
				.select("*")
				.eq("is_archived", false)
				.order("created_at", { ascending: false });

			if (error) throw error;
			setHabits(data);
		} catch (error) {
			setError(error instanceof Error ? error.message : "エラーが発生しました");
		} finally {
			setLoading(false);
		}
	}

	return { habits, loading, error, refetch: fetchHabits };
}
