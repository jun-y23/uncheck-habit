import { zodResolver } from "@hookform/resolvers/zod";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Button, Input, Text } from "@rneui/themed";
import { format } from "date-fns";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
	ScrollView,
	StyleSheet,
	TouchableOpacity,
	type TouchableOpacityProps,
	View,
} from "react-native";
import * as z from "zod";
import { supabase } from "../libs/supabase";

const habitSchema = z.object({
	name: z
		.string()
		.min(1, "習慣名は必須です")
		.max(50, "習慣名は50文字以内で入力してください"),

	frequency: z.object({
		type: z.enum(["daily", "weekly"]),
		value: z.number().int().positive().optional(),
		daysOfWeek: z.array(z.number()).optional(),
	}),
	startDate: z.date(),
});

type HabitFormData = z.infer<typeof habitSchema>;

type FrequencyOptionProps = {
	type: "daily" | "weekly";
	label: string;
} & TouchableOpacityProps;

const HabitDetailsScreen = () => {
	const params = useLocalSearchParams();
	const router = useRouter();
	const [showDatePicker, setShowDatePicker] = useState(false);

	const habitData = JSON.parse(params.habit as string);

	const { control, handleSubmit, setValue, watch } = useForm<HabitFormData>({
		resolver: zodResolver(habitSchema),
		defaultValues: {
			name: habitData.name,
			frequency: {
				type: habitData.defaultFrequency || "daily",
				value: 1,
			},
			startDate: new Date(),
		},
	});

	const onSubmit = async (data: HabitFormData) => {
		const { name, frequency, startDate } = data;
		const habitData = {
			name,
			frequency_type: frequency.type,
			frequency_value: frequency.value || 1,
			start_date: startDate.toISOString(),
			// Add any other fields as necessary
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			user_id: "YOUR_USER_ID", // Replace with actual user ID
		};

		// Insert the habit data into the Supabase database
		const { data: insertedData, error } = await supabase
			.from("habits")
			.insert([habitData]);

		if (error) {
			throw new Error(error.message);
		}

		console.log("Habit saved successfully:", insertedData);
		// ここでデータを保存するAPIを呼び出す
		router.push("/"); // ホーム画面やハビットリスト画面に遷移
	};

	const frequencyType = useWatch({
		control,
		name: "frequency.type",
	});

	const startDate = useWatch({
		control,
		name: "startDate",
	});

	const FrequencyOption = ({ type, label }: FrequencyOptionProps) => (
		<TouchableOpacity
			style={[
				styles.frequencyOption,
				frequencyType === type && styles.frequencyOptionSelected,
			]}
			onPress={() => setValue("frequency", { type })}
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
			<Text style={styles.title}>{habitData.name} の設定</Text>
			<Text style={styles.label}>頻度</Text>
			<View style={styles.frequencyContainer}>
				<FrequencyOption type="daily" label="毎日" />
				<FrequencyOption type="weekly" label="毎週" />
			</View>

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
											key={`day-${day}`}
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

			<Text style={styles.label}>開始日</Text>
			<Button
				title={format(startDate, "yyyy年MM月dd日")}
				onPress={() => setShowDatePicker(true)}
				type="outline"
			/>
			{showDatePicker && (
				<Controller
					control={control}
					name="startDate"
					render={({ field: { onChange, value } }) => (
						<DateTimePicker
							value={value}
							mode="date"
							display="default"
							onChange={(event, selectedDate) => {
								setShowDatePicker(false);
								if (selectedDate) {
									onChange(selectedDate);
								}
							}}
							locale="ja-JP"
						/>
					)}
				/>
			)}

			<Button
				title="この設定で始める"
				onPress={handleSubmit(onSubmit)}
				containerStyle={styles.submitButton}
				color="warning"
			/>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
		backgroundColor: "#fff",
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		marginBottom: 20,
	},
	label: {
		fontSize: 16,
		fontWeight: "bold",
		marginTop: 10,
		marginBottom: 5,
	},
	buttonContainer: {
		marginBottom: 10,
	},
	submitButton: {
		marginTop: 20,
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
	sublabel: {
		fontSize: 16,
		fontWeight: "600",
		marginTop: 10,
		marginBottom: 5,
		color: "#555",
	},
});

export default HabitDetailsScreen;
