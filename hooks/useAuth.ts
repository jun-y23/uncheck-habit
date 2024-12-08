import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabase } from "../libs/supabase";

export function useSession() {
	const [session, setSession] = useState<Session | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		supabase.auth.getSession().then(({ data: { session } }) => {
			setSession(session);
			setIsLoading(false);

			if (!session) {
				supabase.auth.signInAnonymously().then(({ data: { session } }) => {
					console.log("Signed in anonymously", session);
					setSession(session.user);
					setIsLoading(false);
				});
			}
		});

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setSession(session);
			setIsLoading(false);
		});

		return () => subscription.unsubscribe();
	}, []);

	return { session, isLoading };
}
