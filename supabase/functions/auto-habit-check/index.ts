import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

serve(async (req) => {
	const supabaseClient = createClient(
		Deno.env.get("LOCAL_SUPABASE_URL") ?? "",
		Deno.env.get("LOCAL_SUPABASE_SERVICE_ROLE_KEY") ?? "",
		{
			auth: {
				autoRefreshToken: false,
				persistSession: false,
			},
			// localhost用の設定を追加
			db: {
				schema: "public",
			},
		},
	);

	try {
		const { error } = await supabaseClient.rpc("insert_yesterday_habit_logs");

		if (error) throw error;

		return new Response(
			JSON.stringify({ message: "習慣の自動記録が完了しました" }),
			{ status: 200 },
		);
	} catch (error) {
		console.error("Error:", error);
		return new Response(
			JSON.stringify({ error: error.message }),
			{ status: 500 },
		);
	}
});
