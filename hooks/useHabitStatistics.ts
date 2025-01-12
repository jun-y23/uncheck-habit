import { useQuery } from "@tanstack/react-query";
import { supabase } from "../libs/supabase";
import type { AppHabitStatistics } from "../types/type";

const fetchStatistics = async (): Promise<AppHabitStatistics[]> => {
	const { data, error } = await supabase
		.from("habit_statistics_view")
		.select("*")
		.order("achievement_rate", { ascending: false });

	if (error) {
		throw error;
	}

	return data || [];
};

export const useHabitStatistics = () => {
	const {
		data: statistics,
		isLoading,
		error,
		refetch,
	} = useQuery({
		queryKey: ["habit-statistics"],
		queryFn: fetchStatistics,
	});

	return {
		statistics: statistics || [],
		isLoading,
		error: error instanceof Error ? error : null,
		refetch,
	};
};
