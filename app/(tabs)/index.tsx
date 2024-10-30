import { useHabitLogs } from "@/hooks/useHabitLogs";
import { Button, Icon,  Text } from "@rneui/themed";
import {
	addDays,
	format,
	subDays,
} from "date-fns";
import { ja } from "date-fns/locale";
import { useRouter } from "expo-router";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import CalendarOverlay from "../../components/CalendarOverlay";
import type { HabitLogFormData } from "../../components/CalendarOverlay";
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
	const [currentDate, setCurrentDate] = useState<Date>(subDays(new Date(), 6));
	const [habits, setHabits] = useState<Habit[]>([]);
	const [isOverlayVisible, setIsOverlayVisible] = useState(false);
	const [selectedHabit, setSelectedHabit] = useState<HabitLogFormData | null>(
		null,
	);

	useEffect(() => {
		fetchHabitsAndLogs();
	}, []);

	const fetchHabitsAndLogs = async () => {
		// Placeholder for API call
		const { data: fetchedHabits, error } = await supabase
			.from("habits")
			.select("id, name, icon");

		if (error) {
			return;
		}

		setHabits(fetchedHabits || []);
	};

	const goToPreviousWeek = () => {
		setCurrentDate((prevDate) => subDays(prevDate, 6));
	};

	const openOverlay = (habit: HabitLogFormData) => {
		setSelectedHabit(habit);
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
						currentDate={currentDate}
						onPreviousWeek={goToPreviousWeek}
					/>
					<HabitList
						habits={habits}
						startDate={currentDate}
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
			<CalendarOverlay
				isVisible={isOverlayVisible}
				initailData={selectedHabit}
				onClose={closeOverlay}
			/>
		</GestureHandlerRootView>
	);
};

// WeeklyCalendarView Component
interface WeeklyCalendarViewProps {
	currentDate: Date;
	onPreviousWeek: () => void;
}

const WeeklyCalendarView = (props: WeeklyCalendarViewProps) => {
	const { currentDate, onPreviousWeek} = props;

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
				{format(currentDate, "yyyy年M月", { locale: ja })}
			</Text>
		</View>
	);
};

// HabitList Component
interface HabitListProps {
	habits: Habit[];
	startDate: Date;
	openBottomSheet: (habit: HabitLogFormData) => void;
}

const HabitList = (props: HabitListProps) => {
	const { habits, startDate, openBottomSheet } = props;

	const weekDays = Array.from({ length: 7 }, (_, index) => {
		const date = addDays(startDate, index);
		return format(date, "d(E)", { locale: ja });
	});

	const renderHeader = () => (
		<View style={styles.headerRow}>
			<View style={[styles.cell, styles.habitNameCell]}>
				<Text style={styles.headerText}>習慣</Text>
			</View>
			{weekDays.map((day, index) => {
				const [date, dayOfWeek] = day.split("("); // Split the day string into date and day of the week
				return (
					<View key={`header-${day}`} style={[styles.cell, styles.dateCell]}>
						<Text style={styles.dayText}>{date.trim()}</Text>
						<Text style={styles.dateText}>
							{dayOfWeek.replace(")", "").trim()}
						</Text>
					</View>
				);
			})}
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
						currentDate={startDate}
						openClickCell={openBottomSheet}
					/>
				)}
			/>
		</View>
	);
};

interface HabitRowProps {
	habit: Habit;
	currentDate: Date;
	openClickCell: (habit: HabitLogFormData) => void;
}

const HabitRow: React.FC<HabitRowProps> = ({
	habit,
	currentDate,
	openClickCell,
}) => {
	const [logs, setLogs] = useState<{ [key: string]: any }>({});

	const startDate = currentDate;
	const { fetchLogs, loading, error } = useHabitLogs(habit.id);

	useEffect(() => {
		const loadLogs = async () => {
			const logsData = await fetchLogs(habit.id, currentDate);
			if (logsData) {
				setLogs(logsData);
			}
		};

		loadLogs();
	}, [habit.id, currentDate, fetchLogs]);

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

	const handleOnPress = (date: string, status: HabitStatus) => {
		openClickCell({
			habitID: habit.id,
			date: new Date(date),
			status,
		});
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
			{!loading &&
				logs &&
				logs.length > 0 &&
				logs?.map((log, index) => {
					return (
						<TouchableOpacity
							key={`${index}`}
							style={[styles.cell, styles.dateCell]}
							onPress={() => handleOnPress(log.date, log.status)}
						>
							<View
								style={[
									styles.checkBox,
									{ backgroundColor: getCellColor(log.status) },
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
		justifyContent: "center",
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
