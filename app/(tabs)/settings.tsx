import Ionicons from "@expo/vector-icons/Ionicons";
import { Image, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Settings() {
	return (
		<SafeAreaView>
			<Text>一覧</Text>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	headerImage: {
		color: "#808080",
		bottom: -90,
		left: -35,
		position: "absolute",
	},
	titleContainer: {
		flexDirection: "row",
		gap: 8,
	},
});
