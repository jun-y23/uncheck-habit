import { Button, Dialog, Icon, Text } from "@rneui/themed";
import {
	eachDayOfInterval,
	endOfMonth,
	endOfWeek,
	format,
	getDay,
	isAfter,
	startOfDay,
	startOfMonth,
	startOfWeek,
} from "date-fns";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Dimensions,
	ScrollView,
	StyleSheet,
	TextInput,
	FlatList,
	View,
} from "react-native";
import type { Habit } from "../types/type";
import {useArchiveHabit} from '../hooks/useHabits';	

import { useRouter } from "expo-router";
import { ja } from "date-fns/locale";
import { supabase } from "../libs/supabase";


interface HabitDetailScreenProps {
	id: string;
}

export const HabitDetail: React.FC<HabitDetailScreenProps> = (
	props: HabitDetailScreenProps,
) => {
	const router = useRouter();

	const { id } = props;

	const [habit, setHabit] = useState<Habit>();

	const [isDeleteDialogVisible, setIsDeleteDialogVisible] = useState(false);
	const [selectedMonth, setSelectedMonth] = useState(new Date());
	const [logs, setLogs] = useState<
		{ date: string; status: string; notes: string }[]
	>([]);
	const [isLoading, setIsLoading] = useState(false);
	const today = startOfDay(new Date());

	const getStatusColor = (status?: string) => {
		switch (status) {
			case "achieved":
				return {
					background: "#2ECC71",
					text: "#FFFFFF",
				};
			case "not_achieved":
				return {
					background: "#E74C3C",
					text: "#800000",
				};
			default:
				return {
					background: "#EBEDF0",
					text: "#666666",
				};
		}
	};

	const {mutate: archiveHabit} = useArchiveHabit();

	// // 習慣の削除
	const deleteHabit = async () => {
		try {
			archiveHabit(id)
			setIsDeleteDialogVisible(false);

			router.push("/habits");
		} catch (error) {
			Alert.alert("エラー", "削除に失敗しました");
		}
	};

	const fetchHabit = useCallback(async () => {
		try {
			const { data, error } = await supabase
				.from("habits")
				.select("*")
				.eq("id", id)
				.single();

			setHabit(data);

			if (error) throw error;
		} catch (error) {
			Alert.alert("エラー", "データの取得に失敗しました");
		}
	}, [id]);

	// 月単位のログ取得
	const fetchMonthLogs = useCallback(
		async (date: Date) => {
			try {
				setIsLoading(true);
				const start = startOfMonth(date);
				const end = endOfMonth(date);

				const { data, error } = await supabase
					.from("habit_logs")
					.select("*")
					.eq("habit_id", id)
					.gte("date", format(start, "yyyy-MM-dd"))
					.lte("date", format(end, "yyyy-MM-dd"))
					.order("date");

				if (error) throw error;

				// 日付の配列を生成
				const daysInMonth = eachDayOfInterval({ start, end });

				// ログデータをマップ
				const mappedLogs = daysInMonth.map((day) => {
					const dateStr = format(day, "yyyy-MM-dd");
					const log = data?.find((l) => l.date === dateStr);
					return {
						date: dateStr,
						status: log?.status || "unchecked",
						notes: log?.notes || "",
					};
				});

				setLogs(mappedLogs);
			} catch (error) {
				Alert.alert("エラー", "ログの取得に失敗しました");
			} finally {
				setIsLoading(false);
			}
		},
		[id],
	);

	const notes = logs.filter((log) => log.notes);

	// 月を変更
	const changeMonth = (increment: number) => {
		const newMonth = new Date(
			selectedMonth.setMonth(selectedMonth.getMonth() + increment),
		);
		setSelectedMonth(newMonth);
		fetchMonthLogs(newMonth);
	};

	const renderCalendar = () => {
		const monthStart = startOfMonth(selectedMonth);
		const monthEnd = endOfMonth(selectedMonth);

		// カレンダーの開始日と終了日を取得（前月末と翌月初めを含む）
		const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
		const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

		// カレンダーに表示する全ての日付を取得
		const calendarDays = eachDayOfInterval({
			start: calendarStart,
			end: calendarEnd,
		});

		// 曜日の表示
		const weekDays = ["日", "月", "火", "水", "木", "金", "土"];

		return (
			<View style={styles.calendarContainer}>
				{/* 曜日ヘッダー */}
				<View style={styles.weekDayHeader}>
					{weekDays.map((day, index) => (
						<View key={day.toString()} style={styles.weekDayCell}>
							<Text
								style={[
									styles.weekDayText,
									index === 0
										? styles.sundayText
										: index === 6
											? styles.saturdayText
											: null,
								]}
							>
								{day}
							</Text>
						</View>
					))}
				</View>

				<View style={styles.calendar}>
					{calendarDays.map((day) => {
						const dateStr = format(day, "yyyy-MM-dd");
						const log = logs.find((l) => l.date === dateStr);
						const colors = getStatusColor(log?.status);
						const isToday = format(today, "yyyy-MM-dd") === dateStr;
						const isCurrentMonth = day.getMonth() === selectedMonth.getMonth();
						const dayOfWeek = getDay(day);
						const isFutureDate = isAfter(startOfDay(day), today);

						return (
								<View
									key={dateStr}
									style={[
										styles.calendarCell,
										{ backgroundColor: colors.background },
										isToday && styles.todayCell,
										isFutureDate && styles.futureDateCell,
									]}
								>
									<Text
										style={[
											styles.dayText,
											{ color: colors.text },
											!isCurrentMonth && styles.otherMonthText,
											dayOfWeek === 0 && styles.sundayText,
											dayOfWeek === 6 && styles.saturdayText,
											isFutureDate && styles.futureDateText,
										]}
									>
										{format(day, "d")}
									</Text>
									{log?.notes && isCurrentMonth && !isFutureDate && (
										<View style={styles.noteIndicator}>
											<Icon
												name="message-circle"
												type="feather"
												size={10}
												color={colors.text}
											/>
										</View>
									)}
								</View>
						);
					})}
				</View>
			</View>
		);
	};

	useEffect(() => {
		fetchMonthLogs(selectedMonth);
	}, [fetchMonthLogs, selectedMonth]);

	useEffect(() => {
		fetchHabit();
	}, [fetchHabit]);

	if (!habit) {
		return <ActivityIndicator size="large" color="#0000ff" />;
	}

	return (
		<ScrollView style={styles.container}>
			{/* 習慣名編集セクション */}
			<View style={styles.nameSection}>
				<View style={styles.nameContainer}>
					<Text style={styles.nameText}>{habit.name}</Text>
					<Icon name="delete" onPress={() => setIsDeleteDialogVisible(true)} />
				</View>
			</View>

			{/* 月選択セクション */}
			<View style={styles.monthSelector}>
				<Icon name="chevron-left" onPress={() => changeMonth(-1)} />
				<Text style={styles.monthText}>
					{format(selectedMonth, "yyyy年M月", { locale: ja })}
				</Text>
				<Icon name="chevron-right" onPress={() => changeMonth(1)} />
			</View>

			{/* カレンダー表示 */}
			{isLoading ? (
				<ActivityIndicator size="large" color="#0000ff" />
			) : (
				renderCalendar()
			)}

			{notes.map((note) => (
					<View style={styles.logItem} key={note.date}>
						<Text style={styles.dateText}>{note.date}</Text>
							<Text style={styles.notesText}>{note.notes}</Text>
					</View>
			))}

			<Dialog
				isVisible={isDeleteDialogVisible}
				onBackdropPress={() => setIsDeleteDialogVisible(false)}
			>
				<Dialog.Title title="習慣の削除" />
				<Text>本当にこの習慣を削除しますか？</Text>
				<Dialog.Actions>
					<Dialog.Button
						title="キャンセル"
						onPress={() => setIsDeleteDialogVisible(false)}
						titleStyle={{}} // 空のオブジェクトを明示的に渡す
					/>
					<Dialog.Button
						title="削除"
						onPress={deleteHabit}
						titleStyle={{ color: "red" }}
					/>
				</Dialog.Actions>
			</Dialog>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
	},
	nameSection: {
		padding: 16,
		borderBottomWidth: 1,
		borderBottomColor: "#E0E0E0",
	},
	nameContainer: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
	},
	nameText: {
		fontSize: 20,
		fontWeight: "600",
	},
	editContainer: {
		flexDirection: "row",
		alignItems: "center",
	},
	nameInput: {
		flex: 1,
		fontSize: 24,
		padding: 8,
		borderWidth: 1,
		borderColor: "#E0E0E0",
		borderRadius: 4,
		marginRight: 8,
	},
	editIcon: {
		padding: 8,
	},
	saveButton: {
		paddingHorizontal: 16,
	},
	monthSelector: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		padding: 16,
		backgroundColor: "#F5F5F5",
	},
	monthText: {
		fontSize: 18,
		fontWeight: "600",
	},
	weekDayHeader: {
		flexDirection: "row",
		justifyContent: "space-around",
		paddingVertical: 10,
		backgroundColor: "#F2F2F7",
	},

	weekDayCell: {
		width: (Dimensions.get("window").width - 48) / 7,
		alignItems: "center",
		paddingVertical: 8,
	},
	weekDayText: {
		fontSize: 12,
		fontWeight: "600",
		color: "#666666",
	},
	calendarContainer: {
		marginTop: 8,
		backgroundColor: "#FFFFFF",
		borderRadius: 12,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
		padding: 8,
	},
	sundayText: {
		color: "#FF5252",
	},
	saturdayText: {
		color: "#2196F3",
	},
	calendar: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "space-between",
	},
	futureDateText: {
		color: "#C7C7CC",
	},
	futureDateCell: {
		backgroundColor: "#F8F8F8",
	},
	calendarCell: {
		width: (Dimensions.get("window").width - 48) / 7,
		height: (Dimensions.get("window").width - 48) / 7,
		aspectRatio: 1,
		justifyContent: "center",
		alignItems: "center",
		margin: 1.5,
		borderRadius: 8,
		position: "relative",
	},
	todayCell: {
		borderWidth: 2,
		borderColor: "#0366D6",
	},
	otherMonthCell: {
		opacity: 0.3,
	},
	dayText: {
		fontSize: 14,
		fontWeight: "500",
	},
	otherMonthText: {
		color: "#999999",
	},
	noteIndicator: {
		position: "absolute",
		bottom: 4,
		right: 4,
	},

	deleteButton: {
		margin: 16,
		borderColor: "red",
	},
	flatList: {
    flex: 1,
  },
  logItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#333',
  },
  noNotesText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
});
