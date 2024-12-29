import { useHabitLogsSubscription } from "@/hooks/useHabitLogsSubscription";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { Button, Icon, Text } from "@rneui/themed";
import { addDays, format, subDays } from "date-fns";
import { ja } from "date-fns/locale";
import { useRouter } from "expo-router";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	ActivityIndicator,
	Animated,
	FlatList,
	StyleSheet,
	TouchableOpacity,
	View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import CalendarOverlay from "../../components/CalendarOverlay";
import type { HabitLogData } from "../../components/CalendarOverlay";
import { useHabits } from "../../hooks/useHabits";
import type { Habit } from "../../types/type";
import {ErrorDisplay} from "../../components/ErrorDisplay";

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
	const today = format(new Date(), "yyyy-MM-dd");
	const [currentDate, setCurrentDate] = useState<Date>(new Date());

	const [isVisible, setIsVisible] = useState(false);
	const [initialData, setInitialData] = useState<HabitLogData | null>(null);

	const handleOpen = (props: HabitLogData) => {
		setInitialData({
			habitID: props.habitID,
			status: props.status,
			date: new Date(props.date),
			notes: props.notes,
			logID: props?.logID ?? undefined,
			onUpdateLog: props.onUpdateLog,
		});
		setIsVisible(true);
	};

	const handleClose = useCallback(() => {
		setIsVisible(false);
		setInitialData(null);
	}, []);

	const { habits } = useHabits();

	const goToPreviousWeek = () => {
		setCurrentDate((prevDate) => subDays(prevDate, 6));
	};

	const goToNextWeek = () => {
		if (currentDate >= new Date(today)) {
			return;
		}

		setCurrentDate((prevDate) => {
			// currentDateがtodayより未来にならないようにする
			if (
				format(addDays(prevDate, 6), "yyyy-MM-dd") >=
				format(today, "yyyy-MM-dd")
			) {
				return new Date(today);
			}
			return addDays(prevDate, 6);
		});
	};

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<SafeAreaView style={styles.safeArea}>
			<View style={styles.container}>
				<View style={styles.container}>
					<WeeklyCalendarView
						currentDate={currentDate}
						onPreviousWeek={goToPreviousWeek}
						onNextWeek={goToNextWeek}
					/>
					<HabitList
						habits={habits}
						startDate={currentDate}
						onClickCell={handleOpen}
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
				</View>
			</SafeAreaView>
			<CalendarOverlay
				isVisible={isVisible}
				initialData={initialData}
				onClose={handleClose}
			/>
		</GestureHandlerRootView>
	);
};

// WeeklyCalendarView Component
interface WeeklyCalendarViewProps {
	currentDate: Date;
	onPreviousWeek: () => void;
	onNextWeek: () => void;
}

const WeeklyCalendarView = (props: WeeklyCalendarViewProps) => {
	const { currentDate, onPreviousWeek, onNextWeek } = props;

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
	startDate: Date;
	onClickCell: (habit: HabitLogData) => void;
}

const HabitList = (props: HabitListProps) => {
	const { habits, startDate, onClickCell } = props;

	const weekDays = Array.from({ length: 7 }, (_, index) => {
		const start = subDays(startDate, 6); // 今日から6日前を開始日に設定
		const date = addDays(start, index);
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
						onClickCell={onClickCell}
					/>
				)}
			/>
		</View>
	);
};

interface HabitRowProps {
	habit: Habit;
	currentDate: Date;
	onClickCell: (habit: HabitLogData) => void;
}

const HabitRow: React.FC<HabitRowProps> = ({
	habit,
	currentDate,
	onClickCell,
}) => {
	const fadeAnim = useRef(new Animated.Value(1)).current;

	const { logs, isInitialLoading, updatingDates, updateLog, error, retry: fetchLogs } =
		useHabitLogsSubscription({
			habitId: habit.id,
			_currentDate: currentDate,
			onError: (error) => {
				console.error("Habit logs error:", error);
			},
		});

	const animatePress = useCallback(() => {
		Animated.sequence([
			Animated.timing(fadeAnim, {
				toValue: 0.7,
				duration: 100,
				useNativeDriver: true,
			}),
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 100,
				useNativeDriver: true,
			}),
		]).start();
	}, [fadeAnim]);

	const toggleStatus = useCallback(
		async (data: HabitLogData) => {
			animatePress();
			await updateLog({
				logID: data?.logID,
				habitID: habit.id,
				status: data.status,
				date: data.date,
				notes: data?.notes ?? "",
			});
		},
		[updateLog, animatePress, habit.id],
	);

	const getCellColor = useCallback((status: HabitStatus): string => {
		switch (status) {
			case "achieved":
				return "#2ECC71";
			case "not_achieved":
				return "#E74C3C";
			default:
				return "#EBEDF0";
		}
	}, []);

	const getOpacity = useCallback(
		(date: string) => {
			return updatingDates.has(date) ? 0.6 : 1;
		},
		[updatingDates],
	);

	const handleOpen = (props: HabitLogData) => {
		onClickCell({
			habitID: props.habitID,
			status: props.status,
			date: new Date(props.date),
			notes: props.notes,
			logID: props?.logID ?? undefined,
			onUpdateLog: toggleStatus,
		});
	};

	if (isInitialLoading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="small" color="#0000ff" />
			</View>
		);
	}

	if (error) {
    return (
      <ErrorDisplay
        error={error}
        onRetry={fetchLogs}
      />
    );
  }

	return (
		<View style={styles.container}>
			<Animated.View style={[styles.habitRow, { opacity: fadeAnim }]}>
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

				{logs.map((log, index) => {
					const isUpdating = updatingDates.has(log.date);

					return (
						<TouchableOpacity
							key={log.date}
							style={[styles.cell, styles.dateCell]}
							onPress={() =>
								handleOpen({
									habitID: habit.id,
									status: log.status,
									date: new Date(log.date),
									notes: log?.notes ?? undefined,
									logID: log.id,
								})
							}
							disabled={isUpdating}
						>
							<Animated.View
								style={[
									styles.checkBox,
									{
										backgroundColor: getCellColor(log.status),
										opacity: getOpacity(log.date),
									},
								]}
							>
								{isUpdating && (
									<ActivityIndicator
										size="small"
										color="#ffffff"
										style={styles.miniLoader}
									/>
								)}
							</Animated.View>
						</TouchableOpacity>
					);
				})}
			</Animated.View>
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
		gap:10,
	},
	loadingContainer: {
		padding: 16,
		alignItems: "center",
		justifyContent: "center",
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
	// 共通の��ルスタイル
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
	miniLoader: {
		position: "absolute",
	},
	updatingCell: {
		opacity: 0.7,
	},
});

export default HomeScreen;
