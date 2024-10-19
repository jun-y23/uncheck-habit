import { zodResolver } from "@hookform/resolvers/zod";
import { Button, CheckBox, Icon, Input, Text } from "@rneui/themed";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import * as z from "zod";

// Zodスキーマの定義
const habitSchema = z.object({
	name: z
		.string()
		.min(1, "習慣名は必須です")
		.max(50, "習慣名は50文字以内で入力してください"),
	color: z.string(),
	frequency: z.number().int().positive("頻度は正の整数で入力してください"),
	frequencyUnit: z.enum(["daily", "weekly", "monthly"]),
	description: z
		.string()
		.max(200, "説明は200文字以内で入力してください")
		.optional(),
});

type HabitFormData = z.infer<typeof habitSchema>;

const colors = ["#FF0000", "#0000FF", "#00FF00", "#FFFF00", "#800080"];

const NewHabit = () => {
	const router = useRouter();
	const {
		control,
		handleSubmit,
		formState: { errors },
	} = useForm<HabitFormData>({
		resolver: zodResolver(habitSchema),
		defaultValues: {
			name: "",
			color: "#FF0000",
			frequency: 1,
			frequencyUnit: "daily",
			description: "",
		},
	});

	const onSubmit = (data: HabitFormData) => {
		console.log(data);
		// ここでデータを保存するAPIを呼び出す
		// 保存成功後、ホーム画面に戻る
		router.back();
	};

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

			<Controller
				control={control}
				name="frequency"
				render={({ field: { onChange, value } }) => (
					<Input
						label="頻度"
						keyboardType="numeric"
						value={value.toString()}
						onChangeText={(text) => onChange(Number.parseInt(text) || 0)}
						errorMessage={errors.frequency?.message}
					/>
				)}
			/>

			<Text style={styles.label}>頻度の単位</Text>
			<Controller
				control={control}
				name="frequencyUnit"
				render={({ field: { onChange, value } }) => (
					<View style={styles.frequencyUnitContainer}>
						{[
							{ value: "daily", label: "毎日" },
							{ value: "weekly", label: "毎週" },
							{ value: "monthly", label: "毎月" },
						].map((unit) => (
							<CheckBox
								key={unit.value}
								title={unit.label}
								checkedIcon="dot-circle-o"
								uncheckedIcon="circle-o"
								checked={value === unit.value}
								onPress={() => onChange(unit.value)}
								containerStyle={styles.radioContainer}
							/>
						))}
					</View>
				)}
			/>

			<Controller
				control={control}
				name="description"
				render={({ field: { onChange, value } }) => (
					<Input
						label="説明 (オプション)"
						value={value}
						onChangeText={onChange}
						multiline
						errorMessage={errors.description?.message}
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
	frequencyUnitContainer: {
		marginBottom: 20,
	},
	radioContainer: {
		backgroundColor: "transparent",
		borderWidth: 0,
		padding: 0,
		marginLeft: 0,
	},
});

export default NewHabit;
