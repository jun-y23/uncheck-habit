import type { Session } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../libs/supabase";

export function useSession() {
	const [session, setSession] = useState<Session | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const signInAnonymously = useCallback(async () => {
		try {
			const { data, error } = await supabase.auth.signInAnonymously();

			if (error) {
				console.error("Anonymous sign in error:", error.message);
				return { error };
			}

			setSession(data.session);
			return { data };
		} catch (error) {
			console.error("Unexpected error during anonymous sign in:", error);
			return { error };
		}
	}, []);

	useEffect(() => {
		supabase.auth.getSession().then(({ data: { session } }) => {
			setSession(session);
			setIsLoading(false);

			// if (!session) {
			// 	supabase.auth.signInAnonymously().then(({ data: { session } }) => {
			// 		console.log("Signed in anonymously", session);
			// 		setSession(session.user);
			// 		setIsLoading(false);
			// 	});
			// }
		});

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setSession(session);
			setIsLoading(false);
		});

		return () => subscription.unsubscribe();
	}, []);

	return { session, isLoading, signInAnonymously };
}
