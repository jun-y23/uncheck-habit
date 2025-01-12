import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../libs/supabase";
import type { Database } from "../types/schema";
import { useSession } from "./useAuth";
import { useEffect } from "react";

type Habit = Database["public"]["Tables"]["habits"]["Row"];
type HabitInsert = Database["public"]["Tables"]["habits"]["Insert"];
type HabitUpdate = Database["public"]["Tables"]["habits"]["Update"];
type HabitLog = Database["public"]["Tables"]["habit_logs"]["Row"];
type Template = Database["public"]["Tables"]["habit_templates"]["Row"];

const fetchHabits = async (): Promise<Habit[]> => {
	const { data, error } = await supabase
		.from("habits")
		.select("*")
		.eq("is_archived", false)
		.order("created_at", { ascending: false });

	if (error) {
		throw error;
	}

	return data || [];
};

export function useHabits() {
	const {
		data: habits = [],
		isLoading,
		error,
		refetch,
	} = useQuery({
		queryKey: ["habits"],
		queryFn: fetchHabits,
	});

	return {
		habits,
		loading: isLoading,
		error: error instanceof Error ? error.message : null,
		refetch,
	};
}

// 必要に応じて、追加のミューテーション関数も提供できます
export function useCreateHabit() {
	const queryClient = useQueryClient();
	const { session } = useSession();

	return useMutation({
		mutationFn: async (habit: Omit<HabitInsert, "user_id">) => {
			if (!session?.user) throw new Error("認証が必要です");

			const { data, error } = await supabase
				.from("habits")
				.insert([{ ...habit, user_id: session.user.id }])
				.single();

			if (error) throw error;
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["habits"] });
		},
	});
}

export function useUpdateHabit() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ id, ...updates }: HabitUpdate & { id: string }) => {
			const { data, error } = await supabase
				.from("habits")
				.update(updates)
				.eq("id", id)
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["habits"] });
		},
	});
}

export function useArchiveHabit() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			const { error } = await supabase
				.from("habits")
				.update({ is_archived: true })
				.eq("id", id);

			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["habit-statistics"] });
			queryClient.invalidateQueries({ queryKey: ["habits"] });
		},
	});
}

// リアルタイム更新が必要な場合
export function useRealtimeHabits() {
	const queryClient = useQueryClient();

	useEffect(() => {
		const subscription = supabase
			.channel("habits_changes")
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "habits",
				},
				() => {
					queryClient.invalidateQueries({ queryKey: ["habits"] });
				},
			)
			.subscribe();

		return () => {
			subscription.unsubscribe();
		};
	}, [queryClient]);

	return useHabits();
}
