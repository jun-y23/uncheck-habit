import { SafeAreaView } from "react-native-safe-area-context";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { useHabits } from "../../../hooks/useHabits";
import { HabitList } from "../../../components/HabitList";

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
