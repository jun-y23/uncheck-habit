import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";
import React from "react";

import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { usePathname } from "expo-router";

export default function TabLayout() {
	const colorScheme = useColorScheme();

	const pathname = usePathname();
	const isHabitDetail = pathname.match(/^\/habits\/[^/]+$/);

	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
				tabBarStyle: isHabitDetail ? { display: "none" } : undefined,
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "ホーム",
					tabBarIcon: ({ color, focused }) => (
						<TabBarIcon
							name={focused ? "home" : "home-outline"}
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="habits"
				options={{
					headerShown: false,
					title: "習慣一覧",
					tabBarIcon: ({ color, focused }) => (
						<TabBarIcon
							name={focused ? "code-slash" : "code-slash-outline"}
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="settings"
				options={{
					title: "設定",
					tabBarIcon: ({ color }) => (
						<FontAwesome size={28} name="cog" color={color} />
					),
				}}
			/>
		</Tabs>
	);
}
