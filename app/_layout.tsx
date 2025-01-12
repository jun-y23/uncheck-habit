import 'react-native-gesture-handler';
import "react-native-reanimated";
import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
// import * as SplashScreen from "expo-splash-screen";
import { useCallback, useState } from "react";
import ErrorBoundary  from 'react-native-error-boundary';
import {ErrorDisplay} from "@/components/ErrorDisplay";

import { useSession } from "@/hooks/useAuth";
import { useColorScheme } from "@/hooks/useColorScheme";
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Sentry from "@sentry/react-native";
import { QueryClientProvider } from '@tanstack/react-query';
import {queryClient} from '../libs/query-client';

Sentry.init({
  dsn: "https://58c530e0e755d6a281ce4e7ba0b63979@o4508559704457216.ingest.us.sentry.io/4508559709831169",
  debug: true, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
  tracesSampleRate: 0.2, // Set tracesSampleRate to 1.0 to capture 100% of transactions for tracing. Adjusting this value in production.
});

function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  const { session, isLoading, signInAnonymously } = useSession();

  const onLayoutRootView = useCallback(async () => {
    if (loaded) {
      try {
        // await SplashScreen.hideAsync();
      } catch (e) {
        console.warn('Failed to hide splash screen:', e);
      }
    }
  }, [loaded]);

  const handleAnonymousSignIn = async () => {
    await signInAnonymously();
  }

  if (!loaded) {
    return null;
  }

  if (!session) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>HabiTora</Text>
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
    <QueryClientProvider client={queryClient}>
    <ErrorBoundary FallbackComponent={ErrorDisplay}>
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
    </ErrorBoundary>
    </QueryClientProvider>
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

// https://github.com/expo/expo/issues/33316
export default Sentry.wrap(RootLayout);
