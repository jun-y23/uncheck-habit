import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/schema";

const supabaseUrl = process.env.NODE_ENV === "developmentqq"
	? (process.env.EXPO_PUBLIC_SUPABASE_LOCAL_URL as string) // Use local URL for development
	: (process.env.EXPO_PUBLIC_SUPABASE_URL as string);

const supabaseAnonKey = process.env.NODE_ENV === "developmentqq"
	? (process.env.EXPO_PUBLIC_SUPABASE_LOCAL_ANON_KEY as string) // Use local anon key for development
	: (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string);

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
	auth: {
		storage: AsyncStorage,
		autoRefreshToken: true,
		persistSession: true,
		detectSessionInUrl: false,
	},
});
