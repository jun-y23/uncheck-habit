import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Stack } from "expo-router/stack";
import { Pressable } from "react-native";

export default function Layout() {
	const router = useRouter();

	return (
		<Stack
			screenOptions={{
				headerShown: false,
			}}
		>
			<Stack.Screen
				name="index"
				options={{
					headerShown: true, // ヘッダーを表示
					headerTitle: "一覧", // ヘッダータイトルを非表示
				}}
			/>
			<Stack.Screen
				name="[id]"
				options={{
					headerShown: true, // ヘッダーを表示
					headerTitle: "", // ヘッダータイトルを非表示
					animation: "slide_from_right", // 右からスライド
					contentStyle: {
						backgroundColor: "white",
					},
				}}
			/>
		</Stack>
	);
}
