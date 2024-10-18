import Ionicons from "@expo/vector-icons/Ionicons";
import { Image, StyleSheet, Text } from "react-native";

export default function Settings() {
	return <Text>setting</Text>;
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
