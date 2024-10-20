import { Button, Icon, ListItem, Text } from "@rneui/themed";
import {
	addDays,
	addWeeks,
	format,
	isFuture,
	isToday,
	startOfWeek,
	subWeeks,
} from "date-fns";
import { ja } from "date-fns/locale";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Type definitions
type HabitStatus = "unchecked" | "achieved" | "not_achieved";

interface Habit {
	id: string;
	name: string;
	color: string;
	icon: string;
}

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
	const [weeklyLogs, setWeeklyLogs] = useState<WeeklyLogs>({});

	useEffect(() => {
		fetchHabitsAndLogs();
	}, [currentWeek]);

	const fetchHabitsAndLogs = () => {
		// Placeholder for API call
		const fetchedHabits: Habit[] = [
			{ id: "1", name: "読書", color: "#FF5733", icon: "book" },
			{ id: "2", name: "運動", color: "#33FF57", icon: "fitness-center" },
		];
		setHabits(fetchedHabits);

		// Initialize all past days as 'unchecked'
		const newWeeklyLogs: WeeklyLogs = {};
		fetchedHabits.forEach((habit) => {
			newWeeklyLogs[habit.id] = {};
			for (let i = 0; i < 7; i++) {
				const date = format(
					addDays(startOfWeek(currentWeek, { weekStartsOn: 1 }), i),
					"yyyy-MM-dd",
				);
				if (!isFuture(new Date(date)) && !isToday(new Date(date))) {
					newWeeklyLogs[habit.id][date] = "unchecked";
				}
			}
		});
		setWeeklyLogs(newWeeklyLogs);
	};

	const toggleHabitStatus = (habitId: string, date: string) => {
		setWeeklyLogs((prevLogs) => {
			const habitLog = prevLogs[habitId] || {};
			const currentStatus = habitLog[date] || "unchecked";
			let newStatus: HabitStatus;
			switch (currentStatus) {
				case "unchecked":
					newStatus = "achieved";
					break;
				case "achieved":
					newStatus = "not_achieved";
					break;
				case "not_achieved":
					newStatus = "unchecked";
					break;
				default:
					newStatus = "unchecked";
			}
			return {
				...prevLogs,
				[habitId]: {
					...habitLog,
					[date]: newStatus,
				},
			};
		});
	};

	const resetHabitStatus = (habitId: string, date: string) => {
		setWeeklyLogs((prevLogs) => ({
			...prevLogs,
			[habitId]: {
				...prevLogs[habitId],
				[date]: "unchecked",
			},
		}));
	};

	const goToPreviousWeek = () => {
		setCurrentWeek((prevWeek) => subWeeks(prevWeek, 1));
	};

	const goToNextWeek = () => {
		setCurrentWeek((prevWeek) => addWeeks(prevWeek, 1));
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.container}>
				<WeeklyCalendarView
					currentWeek={currentWeek}
					onPreviousWeek={goToPreviousWeek}
					onNextWeek={goToNextWeek}
				/>
				<HabitList
					habits={habits}
					weeklyLogs={weeklyLogs}
					currentWeek={currentWeek}
					onToggleStatus={toggleHabitStatus}
					onResetStatus={resetHabitStatus}
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
	weeklyLogs: WeeklyLogs;
	currentWeek: Date;
	onToggleStatus: (habitId: string, date: string) => void;
	onResetStatus: (habitId: string, date: string) => void;
}

const HabitList = (props: HabitListProps) => {
	const { habits, weeklyLogs, currentWeek, onToggleStatus, onResetStatus } =
		props;

	const startDate = startOfWeek(currentWeek, { weekStartsOn: 1 });
	const weekDays = ["月", "火", "水", "木", "金", "土", "日"];

	return (
		<View>
			<ListItem containerStyle={styles.headerRow}>
				<ListItem.Content style={styles.habitNameColumn}>
					<Text style={styles.headerText}>習慣</Text>
				</ListItem.Content>
				{weekDays.map((day, index) => (
					<View key={index} style={styles.dateColumn}>
						<Text style={styles.dayText}>{day}</Text>
						<Text style={styles.dateText}>
							{format(addDays(startDate, index), "d")}
						</Text>
					</View>
				))}
			</ListItem>
			<FlatList
				data={habits}
				keyExtractor={(item) => item.id}
				renderItem={({ item }) => (
					<HabitRow
						habit={item}
						weeklyLog={weeklyLogs[item.id] || {}}
						currentWeek={currentWeek}
						onToggleStatus={onToggleStatus}
						onResetStatus={onResetStatus}
					/>
				)}
			/>
		</View>
	);
};

// HabitRow Component
interface HabitRowProps {
	habit: Habit;
	weeklyLog: WeeklyLog;
	currentWeek: Date;
	onToggleStatus: (habitId: string, date: string) => void;
	onResetStatus: (habitId: string, date: string) => void;
}

const HabitRow = (props: HabitRowProps) => {
	const { habit, weeklyLog, currentWeek, onToggleStatus, onResetStatus } =
		props;

	const startDate = startOfWeek(currentWeek, { weekStartsOn: 1 });

	const getIconName = (status: HabitStatus): string => {
		switch (status) {
			case "achieved":
				return "check-circle";
			case "not_achieved":
				return "close-circle";
			default:
				return "circle-outline";
		}
	};

	const getIconColor = (status: HabitStatus): string => {
		switch (status) {
			case "achieved":
				return habit.color;
			case "not_achieved":
				return "red";
			default:
				return "gray";
		}
	};

	return (
		<ListItem containerStyle={styles.habitRow}>
			<ListItem.Content style={styles.habitNameColumn}>
				<Icon name={habit.icon} color={habit.color} />
				<Text style={styles.habitName}>{habit.name}</Text>
			</ListItem.Content>
			{[0, 1, 2, 3, 4, 5, 6].map((dayOffset) => {
				const date = format(addDays(startDate, dayOffset), "yyyy-MM-dd");
				const status = weeklyLog[date] || "unchecked";
				const isFutureDate = isFuture(new Date(date));
				const isTodayDate = isToday(new Date(date));

				return (
					<TouchableOpacity
						key={dayOffset}
						style={styles.dateColumn}
						onPress={() => {
							if (!isFutureDate && !isTodayDate) {
								onToggleStatus(habit.id, date);
							}
						}}
						onLongPress={() => {
							if (!isFutureDate && !isTodayDate) {
								onResetStatus(habit.id, date);
							}
						}}
					>
						<Icon
							name={getIconName(status)}
							type="material-community"
							color={getIconColor(status)}
							size={24}
						/>
					</TouchableOpacity>
				);
			})}
		</ListItem>
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
	},
	headerRow: {
		backgroundColor: "#e0e0e0",
		paddingVertical: 10,
	},
	headerText: {
		fontWeight: "bold",
	},
	habitRow: {
		paddingVertical: 10,
		paddingHorizontal: 5,
	},
	habitNameColumn: {
		flex: 2,
		flexDirection: "row",
		alignItems: "center",
	},
	habitName: {
		marginLeft: 10,
	},
	dateColumn: {
		flex: 1,
		alignItems: "center",
	},
	dayText: {
		fontSize: 12,
	},
	dateText: {
		fontSize: 14,
		fontWeight: "bold",
	},
});

export default HomeScreen;
