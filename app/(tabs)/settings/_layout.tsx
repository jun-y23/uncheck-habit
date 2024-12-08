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
					headerShown: false,
					headerTitle: "設定", // ヘッダータイトルを非表示
				}}
			/>
			<Stack.Screen name="delete-account" options={{}} />
		</Stack>
	);
}
