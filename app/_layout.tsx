import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";

import { useSession } from "@/hooks/useAuth";
import { useColorScheme } from "@/hooks/useColorScheme";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
	const colorScheme = useColorScheme();
	const [loaded] = useFonts({
		SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
	});

	const { session, isLoading } = useSession();

	useEffect(() => {
		if (loaded) {
			SplashScreen.hideAsync();
		}
	}, [loaded]);

	if (!loaded) {
		return null;
	}

	return (
		<ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
			<Stack>
				<Stack.Screen
					name="(tabs)"
					options={{ headerShown: false, title: "ホーム" }}
				/>
				<Stack.Screen name="+not-found" />
				<Stack.Screen
					name="habit-selection"
					options={{
						title: "習慣を選択",
					}}
				/>
				<Stack.Screen
					name="habit-details"
					options={{
						title: "習慣の詳細",
					}}
				/>
			</Stack>
		</ThemeProvider>
	);
}
