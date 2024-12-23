import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useCallback } from "react";
import "react-native-reanimated";

import { useSession } from "@/hooks/useAuth";
import { useColorScheme } from "@/hooks/useColorScheme";
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
	const colorScheme = useColorScheme();
	const [loaded] = useFonts({
		SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
	});

	const { session, isLoading, signInAnonymously } = useSession();

	const onLayoutRootView = useCallback(async () => {
    if (loaded) {
      // This is where you can add custom splash screen logic
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2秒間表示
      await SplashScreen.hideAsync();
    }
  }, [loaded]);


  const handleAnonymousSignIn = async () => {
    const { error } = await signInAnonymously();
  };

	useEffect(() => {
		onLayoutRootView();
	}, [loaded]);

	if (!loaded) {
		return null;
	}

	if (!session) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>
						Uncheck Habit
					</Text>
          <TouchableOpacity 
            style={styles.startButton}
            onPress={handleAnonymousSignIn}
          >
            <Text style={styles.buttonText}>始める</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

	return (
		<View style={{ flex: 1 }} onLayout={onLayoutRootView}>
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
		</View>
	);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  startButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});