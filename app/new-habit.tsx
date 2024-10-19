import { zodResolver } from "@hookform/resolvers/zod";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Button, Icon, Input, Text } from "@rneui/themed";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import * as z from "zod";

// habitのデータ構造
interface Habit {
	id: string;
	name: string;
	color: string;
	description?: string;
	frequency: FrequencyPattern;
	startDate: Date;
	goal?: {
		type: "count" | "duration";
		value: number;
		unit: string;
	};
	effect?: {
		value: number;
		unit: string;
	};
}

// 頻度パターンの定義（変更なし）
type FrequencyPattern = DailyPattern | WeeklyPattern | MonthlyPattern;

interface DailyPattern {
	type: "daily";
	interval: number;
}

interface WeeklyPattern {
	type: "weekly";
	daysOfWeek: number[];
	interval?: number;
}

interface MonthlyPattern {
	type: "monthly";
	dayOfMonth?: number;
	weekOfMonth?: number;
	dayOfWeek?: number;
	interval?: number;
}

// Zodスキーマの定義（更新）
const habitSchema = z.object({
	name: z
		.string()
		.min(1, "習慣名は必須です")
		.max(50, "習慣名は50文字以内で入力してください"),
	color: z.string(),
	description: z
		.string()
		.max(200, "説明は200文字以内で入力してください")
		.optional(),
	frequency: z.discriminatedUnion("type", [
		z.object({
			type: z.literal("daily"),
			interval: z.number().int().positive(),
		}),
		z.object({
			type: z.literal("weekly"),
			daysOfWeek: z
				.array(z.number().min(0).max(6))
				.min(1, "少なくとも1日は選択してください"),
			interval: z.number().int().positive().optional(),
		}),
		z.object({
			type: z.literal("monthly"),
			dayOfMonth: z.number().min(1).max(31).optional(),
			weekOfMonth: z.number().min(1).max(5).optional(),
			dayOfWeek: z.number().min(0).max(6).optional(),
			interval: z.number().int().positive().optional(),
		}),
	]),
	startDate: z.date(),
	goal: z
		.object({
			type: z.enum(["count", "duration"]),
			value: z.number().positive(),
			unit: z.string(),
		})
		.optional(),
	effect: z
		.object({
			value: z.number(),
			unit: z.string(),
		})
		.optional(),
});

type HabitFormData = z.infer<typeof habitSchema>;

const colors = ["#FF0000", "#0000FF", "#00FF00", "#FFFF00", "#800080"];

const NewHabit = () => {
	const router = useRouter();
	const {
		control,
		handleSubmit,
		watch,
		setValue,
		formState: { errors },
	} = useForm<HabitFormData>({
		resolver: zodResolver(habitSchema),
		defaultValues: {
			name: "",
			color: "#FF0000",
			frequency: { type: "daily", interval: 1 },
			startDate: new Date(),
		},
	});

	const frequencyType = watch("frequency.type");
	const goalType = watch("goal.type");

	const onSubmit = (data: HabitFormData) => {
		console.log(data);
		// ここでデータを保存するAPIを呼び出す
		// 保存成功後、ホーム画面に戻る
		router.back();
	};

	const FrequencyOption = ({ type, label }) => (
		<TouchableOpacity
			style={[
				styles.frequencyOption,
				frequencyType === type && styles.frequencyOptionSelected,
			]}
			onPress={() => setValue("frequency", { type, interval: 1 })}
		>
			<Text
				style={[
					styles.frequencyOptionText,
					frequencyType === type && styles.frequencyOptionTextSelected,
				]}
			>
				{label}
			</Text>
		</TouchableOpacity>
	);

	return (
		<ScrollView style={styles.container}>
			<Stack.Screen options={{ title: "新しい習慣の登録" }} />

			<Controller
				control={control}
				name="name"
				render={({ field: { onChange, value } }) => (
					<Input
						label="習慣名"
						value={value}
						onChangeText={onChange}
						errorMessage={errors.name?.message}
					/>
				)}
			/>

			<Text style={styles.label}>テーマカラー</Text>
			<Controller
				control={control}
				name="color"
				render={({ field: { onChange, value } }) => (
					<View style={styles.colorContainer}>
						{colors.map((color) => (
							<TouchableOpacity
								key={color}
								style={[styles.colorButton, { backgroundColor: color }]}
								onPress={() => onChange(color)}
							>
								{value === color && (
									<Icon
										name="check"
										type="font-awesome"
										color={getContrastColor(color)}
										size={20}
									/>
								)}
							</TouchableOpacity>
						))}
					</View>
				)}
			/>

			<Text style={styles.label}>頻度</Text>
			<View style={styles.frequencyContainer}>
				<FrequencyOption type="daily" label="毎日" />
				<FrequencyOption type="weekly" label="毎週" />
				<FrequencyOption type="monthly" label="毎月" />
			</View>

			{frequencyType === "daily" && (
				<Controller
					control={control}
					name="frequency.interval"
					render={({ field: { onChange, value } }) => (
						<Input
							label="間隔（日）"
							keyboardType="numeric"
							value={value?.toString()}
							onChangeText={(text) => onChange(Number.parseInt(text) || 1)}
							errorMessage={errors.frequency?.interval?.message}
						/>
					)}
				/>
			)}

			{frequencyType === "weekly" && (
				<>
					<Text style={styles.sublabel}>曜日を選択</Text>
					<Controller
						control={control}
						name="frequency.daysOfWeek"
						render={({ field: { onChange, value } }) => (
							<View style={styles.weekDaysContainer}>
								{["日", "月", "火", "水", "木", "金", "土"].map(
									(day, index) => (
										<TouchableOpacity
											key={index}
											style={[
												styles.weekDayButton,
												value?.includes(index) && styles.weekDayButtonSelected,
											]}
											onPress={() => {
												const newValue = value?.includes(index)
													? value.filter((v) => v !== index)
													: [...(value || []), index];
												onChange(newValue);
											}}
										>
											<Text
												style={[
													styles.weekDayText,
													value?.includes(index) && styles.weekDayTextSelected,
												]}
											>
												{day}
											</Text>
										</TouchableOpacity>
									),
								)}
							</View>
						)}
					/>
				</>
			)}

			{frequencyType === "monthly" && (
				<Controller
					control={control}
					name="frequency.dayOfMonth"
					render={({ field: { onChange, value } }) => (
						<Input
							label="日付 (1-31)"
							keyboardType="numeric"
							value={value?.toString()}
							onChangeText={(text) =>
								onChange(Number.parseInt(text) || undefined)
							}
							errorMessage={errors.frequency?.dayOfMonth?.message}
						/>
					)}
				/>
			)}

			<Text style={styles.label}>開始日</Text>
			<Controller
				control={control}
				name="startDate"
				render={({ field: { onChange, value } }) => (
					<DateTimePicker
						value={value}
						mode="date"
						display="default"
						onChange={(event, selectedDate) => {
							const currentDate = selectedDate || value;
							onChange(currentDate);
						}}
						locale="ja-JP"
					/>
				)}
			/>

			<Button title="習慣を登録" onPress={handleSubmit(onSubmit)} />
		</ScrollView>
	);
};

// 背景色に基づいてコントラストの高い色（白または黒）を返す関数
const getContrastColor = (hexColor) => {
	// 16進数の色コードをRGB値に変換
	const r = Number.parseInt(hexColor.slice(1, 3), 16);
	const g = Number.parseInt(hexColor.slice(3, 5), 16);
	const b = Number.parseInt(hexColor.slice(5, 7), 16);

	// 輝度を計算
	const brightness = (r * 299 + g * 587 + b * 114) / 1000;

	// 輝度が128以上なら黒、そうでなければ白を返す
	return brightness > 128 ? "black" : "white";
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
	},
	label: {
		fontSize: 16,
		fontWeight: "bold",
		marginBottom: 10,
	},
	sublabel: {
		fontSize: 16,
		fontWeight: "600",
		marginTop: 10,
		marginBottom: 5,
		color: "#555",
	},

	colorContainer: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "space-between",
		marginBottom: 20,
	},
	colorButton: {
		width: 50,
		height: 50,
		borderRadius: 25,
		margin: 5,
		justifyContent: "center",
		alignItems: "center",
	},

	picker: {
		marginBottom: 20,
	},
	weekDayCheckbox: {
		width: "14%",
		margin: 0,
		padding: 5,
	},
	frequencyContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 20,
	},

	frequencyOption: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 10,
		borderRadius: 5,
		backgroundColor: "#F0F0F0",
		marginHorizontal: 5,
	},
	frequencyOptionSelected: {
		backgroundColor: "#007AFF",
	},
	frequencyOptionText: {
		fontSize: 16,
		color: "#000000",
	},
	frequencyOptionTextSelected: {
		color: "#FFFFFF",
	},
	weekDaysContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 20,
	},
	weekDayButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#F0F0F0",
	},
	weekDayButtonSelected: {
		backgroundColor: "#007AFF",
	},
	weekDayText: {
		fontSize: 16,
		color: "#000000",
	},
	weekDayTextSelected: {
		color: "#FFFFFF",
	},
});

export default NewHabit;
