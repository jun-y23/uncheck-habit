import CalendarOverlay from "@/components/CalendarOverlay";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Icon, Input, ListItem, Text } from "@rneui/themed";
import { BottomSheet } from "@rneui/themed";
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
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import * as z from "zod";
import { supabase } from "../../libs/supabase";

// Type definitions
type HabitStatus = "unchecked" | "achieved" | "not_achieved";

interface Habit {
	id: string;
	name: string;
	icon: string;
}

interface WeeklyLog {
	[date: string]: HabitStatus;
}

interface WeeklyLogs {
	[habitId: string]: WeeklyLog;
}

const habitLogSchema = z.object({
	status: z.enum(["unchecked", "achieved", "not_achieved"]),
	memo: z.string().max(200, "メモは200文字以内で入力してください"),
});

type HabitLogFormData = z.infer<typeof habitLogSchema>;

// HomeScreen Component
const HomeScreen = () => {
	const router = useRouter();
	const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
	const [habits, setHabits] = useState<Habit[]>([]);
	const [weeklyLogs, setWeeklyLogs] = useState<WeeklyLogs>({});
	const [isOverlayVisible, setIsOverlayVisible] = useState(false);
	const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
	const [selectedDate, setSelectedDate] = useState<string>("");
	const [initialFormData, setInitialFormData] = useState<HabitLogFormData>({
		status: "unchecked",
		memo: "",
	});

	const { control, handleSubmit, reset, setValue } = useForm<HabitLogFormData>({
		resolver: zodResolver(habitLogSchema),
		defaultValues: {
			status: "not_achieved",
			memo: "",
		},
	});

	useEffect(() => {
		fetchHabitsAndLogs();
	}, []);

	const fetchHabitsAndLogs = async () => {
		// Placeholder for API call
		const { data: fetchedHabits, error } = await supabase
			.from("habit_templates")
			.select("id, name, icon");

		if (error) {
			console.error("Error fetching habits:", error);
			return;
		}

		setHabits(fetchedHabits || []);

		// Initialize all past days as 'unchecked'
		const newWeeklyLogs: WeeklyLogs = {};
		for (const habit of fetchedHabits) {
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
		}
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

	const openOverlay = useCallback(
		(habit: Habit, date: string) => {
			const habitLog = weeklyLogs[habit.id] || {};
			const currentEntry = habitLog[date] || { status: "unchecked", memo: "" };
			setSelectedHabit(habit);
			setSelectedDate(date);
			setInitialFormData({
				status: currentEntry.status,
				memo: currentEntry.memo,
			});
			setIsOverlayVisible(true);
		},
		[weeklyLogs],
	);

	const closeOverlay = useCallback(() => {
		setIsOverlayVisible(false);
	}, []);

	const saveHabitLog = useCallback(
		(data: HabitLogFormData) => {
			if (selectedHabit && selectedDate) {
				setWeeklyLogs((prevLogs) => ({
					...prevLogs,
					[selectedHabit.id]: {
						...prevLogs[selectedHabit.id],
						[selectedDate]: { status: data.status, memo: data.memo },
					},
				}));
			}
		},
		[selectedHabit, selectedDate],
	);

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
						weeklyLogs={weeklyLogs}
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

				<CalendarOverlay
					isVisible={isOverlayVisible}
					onClose={closeOverlay}
					onSave={saveHabitLog}
					initialData={initialFormData}
				/>
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
	weeklyLogs: WeeklyLogs;
	currentWeek: Date;
	openBottomSheet: (habit: Habit, date: string) => void;
}

const HabitList = (props: HabitListProps) => {
	const { habits, weeklyLogs, currentWeek, openBottomSheet } = props;

	const startDate = startOfWeek(currentWeek, { weekStartsOn: 1 });
	const weekDays = ["月", "火", "水", "木", "金", "土", "日"];

	return (
		<View>
			<ListItem containerStyle={styles.headerRow}>
				<ListItem.Content style={styles.habitNameColumn}>
					<Text style={styles.headerText}>習慣</Text>
				</ListItem.Content>
				{weekDays.map((day, index) => (
					<View key={`list-day-${day}`} style={styles.dateColumn}>
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
						openBottomSheet={openBottomSheet}
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
	openBottomSheet: (habit: Habit, date: string) => void;
}

const HabitRow: React.FC<HabitRowProps> = ({
	habit,
	weeklyLog,
	currentWeek,
	openBottomSheet,
}) => {
	const startDate = startOfWeek(currentWeek, { weekStartsOn: 1 });

	const getCellColor = (status: HabitStatus): string => {
		switch (status) {
			case "achieved":
				return habit.color; // 達成時は習慣の色
			case "not_achieved":
				return "#ff7f7f"; // 未達成時は薄い赤色
			default:
				return "#ebedf0"; // 未チェック時はGitHubの空セルの色
		}
	};

	return (
		<ListItem containerStyle={styles.habitRow}>
			<ListItem.Content style={styles.habitNameColumn}>
				<Icon name={habit.icon} />
				<Text style={styles.habitName}>{habit.name}</Text>
			</ListItem.Content>
			{[0, 1, 2, 3, 4, 5, 6].map((dayOffset) => {
				const date = format(addDays(startDate, dayOffset), "yyyy-MM-dd");
				const status = weeklyLog[date] || "unchecked";

				return (
					<TouchableOpacity
						key={dayOffset}
						style={styles.dateColumn}
						onPress={() => {
							openBottomSheet(habit, date);
						}}
					>
						<View
							style={[styles.cell, { backgroundColor: getCellColor(status) }]}
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
		paddingHorizontal: 20,
		paddingVertical: 0,
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
		aspectRatio: 1,
		padding: 2,
	},
	dayText: {
		fontSize: 12,
	},
	dateText: {
		fontSize: 14,
		fontWeight: "bold",
	},
	cell: {
		flex: 1,
		borderRadius: 2,
	},
});

export default HomeScreen;
