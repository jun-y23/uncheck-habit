// supabase/functions/auto-habit-check/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
};

type NewHabitLog = {
	habit_id: string;
	date: string;
	status: string;
	notes: string;
};

serve(async (req) => {
	if (req.method === "OPTIONS") {
		return new Response("ok", { headers: corsHeaders });
	}

	try {
		// Supabase clientの初期化
		const supabaseClient = createClient(
			Deno.env.get("SUPABASE_URL") ?? "",
			Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
		);
		console.log(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));

		// 前日の日付を取得
		const yesterday = new Date();
		const targetDate = yesterday.toISOString().split("T")[0];

		// 毎日の習慣を取得
		const { data: habits, error: habitsError } = await supabaseClient
			.from("habits")
			.select("id, user_id")
			.eq("frequency_type", "daily")
			.eq("is_archived", false);

		if (habitsError) {
			throw habitsError;
		}

		const logsToCreate: NewHabitLog[] = [];

		// 各習慣に対して処理
		for (const habit of habits) {
			// その日のログが既に存在するか確認
			const { data: existingLogs, error: logsError } = await supabaseClient
				.from("habit_logs")
				.select("id")
				.eq("habit_id", habit.id)
				.eq("date", targetDate)
				.limit(1);

			if (logsError) {
				console.error(`Error checking logs for habit ${habit.id}:`, logsError);
				continue;
			}

			// ログが存在しない場合のみ新しいログを作成
			if (!existingLogs || existingLogs.length === 0) {
				logsToCreate.push({
					habit_id: habit.id,
					date: targetDate,
					status: "achieved",
					notes: "",
				});
			}
		}

		// バッチでログを作成
		if (logsToCreate.length > 0) {
			const { error: insertError } = await supabaseClient
				.from("habit_logs")
				.insert(logsToCreate);

			if (insertError) {
				throw insertError;
			}

			console.log(
				`Successfully created ${logsToCreate.length} logs for ${targetDate}`,
			);
		}

		return new Response(
			JSON.stringify({
				message: `Processed ${habits.length} habits, created ${logsToCreate.length} logs`,
				date: targetDate,
			}),
			{
				headers: { ...corsHeaders, "Content-Type": "application/json" },
				status: 200,
			},
		);
	} catch (error) {
		console.error("Error in auto habit check:", error);
		return new Response(JSON.stringify({ error: error.message }), {
			headers: { ...corsHeaders, "Content-Type": "application/json" },
			status: 500,
		});
	}
});
