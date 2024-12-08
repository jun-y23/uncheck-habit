import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HabitList } from "../../../components/HabitList";
import { useHabits } from "../../../hooks/useHabits";

export default function HabitListScreen() {
	return (
		<SafeAreaView style={styles.safeArea}>
			<HabitList />
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: "#f5f5f5",
	},
});
