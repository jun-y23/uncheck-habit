import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HabitList } from "../../../components/HabitList";
import { Button, Icon } from "@rneui/themed";
import {RecalculateStatsButton} from "../../../components/RecalculateStatsButton";
import { useRouter } from "expo-router";

export default function HabitListScreen() {
	const router = useRouter();

	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.container}>
			<RecalculateStatsButton />
			<HabitList />
			<View style={styles.buttonContainer}>
					<Button
						icon={<Icon name="add" color="#ffffff" />}
						title="習慣を追加"
						onPress={() => router.push("/habit-selection")}
						buttonStyle={styles.addButton}
					/>
				</View>
				</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: "#f5f5f5",
	},
	container: {
		flex: 1,
		gap:10,
	},
	buttonContainer: {
		// position: "absolute",
		// bottom: 20,
		// right: 20,
		// 追加: SafeAreaViewの内側に配置されるようにする
		// iPhoneXなどのノッチがある端末でも適切に表示される
		marginBottom: 10,
		alignItems: "flex-end",
		paddingRight: 20,
	},
	addButton: {
		borderRadius: 30,
		width: 150,
	},
});
