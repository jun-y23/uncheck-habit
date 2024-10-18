import { Button, Icon, ListItem, Text } from "@rneui/themed";
import { addDays, addWeeks, format, startOfWeek, subWeeks } from "date-fns";
import { ja } from "date-fns/locale";
import React, { useState, useEffect, useRef } from "react";
import {
	Animated,
	FlatList,
	PanResponder,
	StyleSheet,
	View,
} from "react-native";

// HomeScreen Component
const HomeScreen = () => {
	const [currentWeek, setCurrentWeek] = useState(new Date());
	const [habits, setHabits] = useState([]);
	const [weeklyLogs, setWeeklyLogs] = useState({});
	const pan = useRef(new Animated.ValueXY()).current;
	const panResponder = useRef(
		PanResponder.create({
			onMoveShouldSetPanResponder: (_, gestureState) => {
				return Math.abs(gestureState.dx) > 20;
			},
			onPanResponderMove: Animated.event([null, { dx: pan.x }], {
				useNativeDriver: false,
			}),
			onPanResponderRelease: (_, gestureState) => {
				if (gestureState.dx > 50) {
					setCurrentWeek((prevWeek) => subWeeks(prevWeek, 1));
				} else if (gestureState.dx < -50) {
					setCurrentWeek((prevWeek) => addWeeks(prevWeek, 1));
				}
				Animated.spring(pan, {
					toValue: { x: 0, y: 0 },
					useNativeDriver: false,
				}).start();
			},
		}),
	).current;

	useEffect(() => {
		fetchHabitsAndLogs();
	}, [currentWeek]);

	const fetchHabitsAndLogs = () => {
		// Placeholder for API call
		setHabits([
			{ id: "1", name: "読書", color: "#FF5733", icon: "book" },
			{ id: "2", name: "運動", color: "#33FF57", icon: "fitness-center" },
		]);
		setWeeklyLogs({
			"1": { "2024-03-10": "achieved", "2024-03-11": "not_achieved" },
			"2": { "2024-03-10": "achieved", "2024-03-11": "achieved" },
		});
	};

	const onToggleHabitStatus = (habitId, date) => {
		setWeeklyLogs((prevLogs) => {
			const habitLog = prevLogs[habitId] || {};
			const currentStatus = habitLog[date];
			const newStatus =
				currentStatus === "achieved" ? "not_achieved" : "achieved";
			return {
				...prevLogs,
				[habitId]: {
					...habitLog,
					[date]: newStatus,
				},
			};
		});
	};

	return (
		<Animated.View
			style={[styles.container, { transform: [{ translateX: pan.x }] }]}
			{...panResponder.panHandlers}
		>
			<WeeklyCalendarView currentWeek={currentWeek} />
			<HabitList
				habits={habits}
				weeklyLogs={weeklyLogs}
				currentWeek={currentWeek}
				onToggleStatus={onToggleHabitStatus}
			/>
			<Button
				icon={<Icon name="add" color="#ffffff" />}
				title="習慣を追加"
				onPress={() => {
					/* Navigate to Add Habit Screen */
				}}
				containerStyle={styles.addButton}
			/>
		</Animated.View>
	);
};

// WeeklyCalendarView Component
const WeeklyCalendarView = ({ currentWeek }) => {
	return (
		<View style={styles.calendarContainer}>
			<Text h4 style={styles.monthText}>
				{format(currentWeek, "yyyy年M月", { locale: ja })}
			</Text>
		</View>
	);
};

// HabitList Component
const HabitList = ({ habits, weeklyLogs, currentWeek, onToggleStatus }) => {
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
					/>
				)}
			/>
		</View>
	);
};

// HabitRow Component
const HabitRow = ({ habit, weeklyLog, currentWeek, onToggleStatus }) => {
	const startDate = startOfWeek(currentWeek, { weekStartsOn: 1 });

	return (
		<ListItem containerStyle={styles.habitRow}>
			<ListItem.Content style={styles.habitNameColumn}>
				<Icon name={habit.icon} color={habit.color} />
				<Text style={styles.habitName}>{habit.name}</Text>
			</ListItem.Content>
			{[0, 1, 2, 3, 4, 5, 6].map((dayOffset) => {
				const date = format(addDays(startDate, dayOffset), "yyyy-MM-dd");
				const isAchieved = weeklyLog[date] === "achieved";
				return (
					<View key={dayOffset} style={styles.dateColumn}>
						<Icon
							name={isAchieved ? "check-circle" : "circle-outline"}
							type="material-community"
							color={isAchieved ? habit.color : "gray"}
							size={24}
							onPress={() => onToggleStatus(habit.id, date)}
						/>
					</View>
				);
			})}
		</ListItem>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#f5f5f5",
	},
	calendarContainer: {
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
	addButton: {
		position: "absolute",
		bottom: 20,
		right: 20,
		borderRadius: 30,
	},
});

export default HomeScreen;
