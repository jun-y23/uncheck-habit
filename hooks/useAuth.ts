import type { Session } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../libs/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ANON_SESSION_KEY = "com.junyamaguchi.habitora.auth.anonymous.session";

export function useSession() {
	const [session, setSession] = useState<Session | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	// セッション情報を保存
	const storeSession = useCallback(async (session: Session | null) => {
		try {
			if (session) {
				await AsyncStorage.setItem(ANON_SESSION_KEY, JSON.stringify(session));
			}
		} catch (error) {
			console.error("Failed to store session:", error);
		}
	}, []);

	// 保存されたセッション情報を復元
	const restoreSession = useCallback(async () => {
		try {
			const storedSession = await AsyncStorage.getItem(ANON_SESSION_KEY);
			if (storedSession) {
				const parsedSession = JSON.parse(storedSession);
				// セッションの有効性を確認
				const { data: { session }, error } = await supabase.auth.setSession({
					access_token: parsedSession.access_token,
					refresh_token: parsedSession.refresh_token,
				});

				if (!error && session) {
					setSession(session);
					return true;
				}
			}
			return false;
		} catch (error) {
			console.error("Failed to restore session:", error);
			return false;
		}
	}, []);

	const signInAnonymously = useCallback(async () => {
		try {
			const { data, error } = await supabase.auth.signInAnonymously();

			if (error) {
				return { error };
			}

			if (data.session) {
				setSession(data.session);
				await storeSession(data.session);
			}
			return { data };
		} catch (error) {
			return { error };
		}
	}, [storeSession]);

	useEffect(() => {
		const initializeSession = async () => {
			// 保存されたセッションの復元を試みる
			const restored = await restoreSession();

			if (!restored) {
				// 保存されたセッションがない場合、現在のセッションを取得
				const { data: { session } } = await supabase.auth.getSession();
				if (session) {
					setSession(session);
					await storeSession(session);
				}
			}
			setIsLoading(false);
		};

		initializeSession();

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(async (_event, session) => {
			setSession(session);
			await storeSession(session);
			setIsLoading(false);
		});

		return () => subscription.unsubscribe();
	}, [storeSession, restoreSession]);

	return { session, isLoading, signInAnonymously };
}
