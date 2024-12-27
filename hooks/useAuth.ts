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
				return { error };
			}

			setSession(data.session);
			return { data };
		} catch (error) {
			return { error };
		}
	}, []);

	useEffect(() => {
		supabase.auth.getSession().then(({ data: { session } }) => {
			setSession(session);
			setIsLoading(false);
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
