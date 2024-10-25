import { Button, Icon, Input, ListItem, Text } from "@rneui/themed";
import { addDays, addWeeks, format, startOfWeek, subWeeks } from "date-fns";
import { ja } from "date-fns/locale";
import { useRouter } from "expo-router";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../libs/supabase";
import type { Habit } from "../../types/type";

// Type definitions
type HabitStatus = "unchecked" | "achieved" | "not_achieved";

interface WeeklyLog {
	[date: string]: HabitStatus;
}

interface WeeklyLogs {
	[habitId: string]: WeeklyLog;
}

// HomeScreen Component
const HomeScreen = () => {
	const router = useRouter();
	const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
	const [habits, setHabits] = useState<Habit[]>([]);
	const [isOverlayVisible, setIsOverlayVisible] = useState(false);

	useEffect(() => {
		fetchHabitsAndLogs();
	}, []);

	const fetchHabitsAndLogs = async () => {
		// Placeholder for API call
		const { data: fetchedHabits, error } = await supabase
			.from("habits")
			.select("id, name, icon");

		if (error) {
			console.error("Error fetching habits:", error);
			return;
		}

		setHabits(fetchedHabits || []);
	};

	const goToPreviousWeek = () => {
		setCurrentWeek((prevWeek) => subWeeks(prevWeek, 1));
	};

	const goToNextWeek = () => {
		setCurrentWeek((prevWeek) => addWeeks(prevWeek, 1));
	};

	const openOverlay = () => {
		setIsOverlayVisible(true);
	};

	const closeOverlay = useCallback(() => {
		setIsOverlayVisible(false);
	}, []);

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<SafeAreaView style={styles.safeArea}>
				<View style={styles.container}>
					<WeeklyCalendarView
						currentWeek={currentWeek}
						onPreviousWeek={goToPreviousWeek}
						onNextWeek={goToNextWeek}
					/>
					<HabitList
						habits={habits}
						currentWeek={currentWeek}
						openBottomSheet={openOverlay}
					/>
				</View>
				<View style={styles.buttonContainer}>
					<Button
						icon={<Icon name="add" color="#ffffff" />}
						title="習慣を追加"
						onPress={() => router.push("/habit-selection")}
						buttonStyle={styles.addButton}
					/>
				</View>
			</SafeAreaView>
		</GestureHandlerRootView>
	);
};

// WeeklyCalendarView Component
interface WeeklyCalendarViewProps {
	currentWeek: Date;
	onPreviousWeek: () => void;
	onNextWeek: () => void;
}

const WeeklyCalendarView = (props: WeeklyCalendarViewProps) => {
	const { currentWeek, onPreviousWeek, onNextWeek } = props;

	return (
		<View style={styles.calendarContainer}>
			<Button
				icon={
					<Icon name="chevron-left" type="material-community" color="#000000" />
				}
				type="clear"
				onPress={onPreviousWeek}
			/>
			<Text h4 style={styles.monthText}>
				{format(currentWeek, "yyyy年M月", { locale: ja })}
			</Text>
			<Button
				icon={
					<Icon
						name="chevron-right"
						type="material-community"
						color="#000000"
					/>
				}
				type="clear"
				onPress={onNextWeek}
			/>
		</View>
	);
};

// HabitList Component
interface HabitListProps {
	habits: Habit[];
	currentWeek: Date;
	openBottomSheet: (habit: Habit, date: string) => void;
}

const HabitList = (props: HabitListProps) => {
	const { habits, currentWeek, openBottomSheet } = props;
	const startDate = startOfWeek(currentWeek, { weekStartsOn: 1 });
	const weekDays = ["月", "火", "水", "木", "金", "土", "日"];

	// ヘッダー行を関数として定義
	const renderHeader = () => (
		<View style={styles.headerRow}>
			<View style={[styles.cell, styles.habitNameCell]}>
				<Text style={styles.headerText}>習慣</Text>
			</View>
			{weekDays.map((day, index) => (
				<View key={`header-${day}`} style={[styles.cell, styles.dateCell]}>
					<Text style={styles.dayText}>{day}</Text>
					<Text style={styles.dateText}>
						{format(addDays(startDate, index), "d")}
					</Text>
				</View>
			))}
		</View>
	);

	return (
		<View style={styles.listContainer}>
			{renderHeader()}
			<FlatList
				data={habits}
				keyExtractor={(item) => item.id}
				renderItem={({ item }) => (
					<HabitRow
						habit={item}
						currentWeek={currentWeek}
						openBottomSheet={openBottomSheet}
					/>
				)}
			/>
		</View>
	);
};

interface HabitRowProps {
	habit: Habit;
	currentWeek: Date;
	openBottomSheet: (habit: Habit, date: string) => void;
}

const HabitRow: React.FC<HabitRowProps> = ({
	habit,
	currentWeek,
	openBottomSheet,
}) => {
	const startDate = startOfWeek(currentWeek, { weekStartsOn: 1 });

	const getCellColor = (status: HabitStatus): string => {
		switch (status) {
			case "achieved":
				return "#00FF00";
			case "not_achieved":
				return "#FF7F7F";
			default:
				return "#EBEDF0";
		}
	};

	return (
		<View style={styles.habitRow}>
			{/* 習慣名セル */}
			<View style={[styles.cell, styles.habitNameCell]}>
				<View style={styles.habitContainer}>
					{habit.icon && (
						<Icon
							name={habit.icon}
							size={16}
							style={styles.icon}
							containerStyle={styles.iconContainer}
						/>
					)}
					<Text style={styles.habitName} numberOfLines={1}>
						{habit.name}
					</Text>
				</View>
			</View>

			{/* チェックセル */}
			{[0, 1, 2, 3, 4, 5, 6].map((dayOffset) => {
				const date = format(addDays(startDate, dayOffset), "yyyy-MM-dd");
				const status = "unchecked";

				return (
					<TouchableOpacity
						key={dayOffset}
						style={[styles.cell, styles.dateCell]}
						onPress={() => openBottomSheet(habit, date)}
					>
						<View
							style={[
								styles.checkBox,
								{ backgroundColor: getCellColor(status) },
							]}
						/>
					</TouchableOpacity>
				);
			})}
		</View>
	);
};

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: "#f5f5f5",
	},
	container: {
		flex: 1,
	},
	buttonContainer: {
		position: "absolute",
		bottom: 20,
		right: 20,
		// 追加: SafeAreaViewの内側に配置されるようにする
		// iPhoneXなどのノッチがある端末でも適切に表示される
		marginBottom: 10,
	},
	addButton: {
		borderRadius: 30,
		paddingVertical: 10,
		paddingHorizontal: 20,
	},
	calendarContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		backgroundColor: "white",
		padding: 10,
		marginBottom: 10,
	},
	monthText: {
		textAlign: "center",
		paddingHorizontal: 20,
		paddingVertical: 0,
	},
	listContainer: {
		flex: 1,
		backgroundColor: "white",
	},
	headerRow: {
		flexDirection: "row",
		borderBottomWidth: 1,
		borderBottomColor: "#E0E0E0",
		backgroundColor: "white",
	},
	habitRow: {
		flexDirection: "row",
		borderBottomWidth: 1,
		borderBottomColor: "#F0F0F0",
		backgroundColor: "white",
	},
	// 共通のセルスタイル
	cell: {
		height: 56,
		justifyContent: "center",
		paddingVertical: 8,
	},
	// 習慣名セル（固定幅）
	habitNameCell: {
		width: 90,
		paddingLeft: 16,
		paddingRight: 8,
	},
	// 日付セル（均等幅）
	dateCell: {
		flex: 1,
		alignItems: "center",
		minWidth: 40,
	},
	// ヘッダーテキスト
	headerText: {
		fontSize: 14,
		fontWeight: "500",
		color: "#666666",
	},
	dayText: {
		fontSize: 12,
		color: "#666666",
		marginBottom: 2,
	},
	dateText: {
		fontSize: 14,
		fontWeight: "500",
		color: "#333333",
	},
	// 習慣名エリア
	habitContainer: {
		flexDirection: "row",
		alignItems: "center",
	},
	habitName: {
		fontSize: 14,
		flex: 1,
		color: "#333333",
	},
	iconContainer: {
		marginRight: 8,
	},
	icon: {
		width: 16,
		height: 16,
	},
	// チェックボックス
	checkBox: {
		width: 35,
		height: 35,
		borderRadius: 4,
	},
});

export default HomeScreen;
