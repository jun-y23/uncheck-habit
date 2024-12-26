import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

serve(async (req) => {
	const supabaseClient = createClient(
		Deno.env.get("SUPABASE_URL") ?? "",
		Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
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
