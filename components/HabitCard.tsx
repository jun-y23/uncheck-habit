import { useNavigation } from "@react-navigation/native";
import { Card } from "@rneui/themed";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
	Dimensions,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import type { AppHabitStatistics } from "../types/type";

interface HabitCardProps {
	habit: AppHabitStatistics;
}

const { width } = Dimensions.get("window");
const CARD_MARGIN = 8;
const CARD_WIDTH = (width - CARD_MARGIN * 4) / 2; // 2列の場合の幅

export const HabitCard: React.FC<HabitCardProps> = ({ habit }) => {
	const navigation = useNavigation();

	const handlePress = () => {
		navigation.navigate("habits", {
			screen: "[id]",
			params: {
				id: habit.id,
			},
		});
	};

	return (
		<TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
			<Card containerStyle={styles.cardContainer}>
				<View style={styles.cardContent}>
					<Text style={styles.habitName} numberOfLines={2}>
						{habit.name}
					</Text>

					<View style={styles.infoContainer}>
						<Text style={styles.startDate}>
							開始日:{" "}
							{format(new Date(habit.start_date), "M月d日", { locale: ja })}
						</Text>

						<View style={styles.achievementContainer}>
							<Text style={styles.achievementLabel}>
								達成率 ({habit.achieved_days}/{habit.total_days}日)
							</Text>
							<View style={styles.achievementBar}>
								<View
									style={[
										styles.achievementFill,
										{ width: `${habit.achievement_rate}%` },
									]}
								/>
							</View>
							<Text style={styles.achievementRate}>
								{habit.achievement_rate.toFixed(1)}%
							</Text>
						</View>
					</View>
				</View>
			</Card>
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	cardContainer: {
		width: CARD_WIDTH,
		marginHorizontal: 0,
		marginBottom: CARD_MARGIN * 2,
		borderRadius: 12,
		elevation: 4,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
	},
	cardContent: {
		padding: 12,
	},
	habitName: {
		fontSize: 16,
		fontWeight: "600",
		marginBottom: 8,
		color: "#333",
	},
	infoContainer: {
		marginTop: 8,
	},
	startDate: {
		fontSize: 12,
		color: "#666",
		marginBottom: 8,
	},
	achievementContainer: {
		marginTop: 4,
	},
	achievementLabel: {
		fontSize: 12,
		color: "#666",
		marginBottom: 4,
	},
	achievementBar: {
		height: 4,
		backgroundColor: "#E0E0E0",
		borderRadius: 2,
		overflow: "hidden",
		marginBottom: 4,
	},
	achievementFill: {
		height: "100%",
		backgroundColor: "#4CAF50",
		borderRadius: 2,
	},
	achievementRate: {
		fontSize: 14,
		fontWeight: "600",
		color: "#4CAF50",
		textAlign: "right",
	},
	updatedAt: {
		fontSize: 10,
		color: "#999",
		textAlign: "right",
		marginTop: 8,
	},
});
