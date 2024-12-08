import { useEffect, useState } from "react";
import { supabase } from "../libs/supabase";
import type { Database } from "../types/schema";

type Template = Database["public"]["Tables"]["habit_templates"]["Row"];

export function useHabitTemplates() {
	const [templates, setTemplates] = useState<Template[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		fetchTemplates();
	}, []);

	async function fetchTemplates() {
		try {
			setLoading(true);
			const { data, error } = await supabase
				.from("habit_templates")
				.select("*")
				.order("name");

			if (error) throw error;
			setTemplates(data);
		} catch (error) {
			setError(error instanceof Error ? error.message : "エラーが発生しました");
		} finally {
			setLoading(false);
		}
	}

	return { templates, loading, error };
}
