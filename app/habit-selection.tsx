import { Button, Input, ListItem, Text } from "@rneui/themed";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
	FlatList,
	ScrollView,
	StyleSheet,
	TouchableOpacity,
	View,
} from "react-native";

// 事前定義された習慣のリスト
const predefinedHabits = [
	{
		id: "1",
		name: "禁煙",
		icon: "🚭",
		defaultFrequency: "daily",
		defaultEffect: { type: "money", unit: "円" },
	},
	{
		id: "2",
		name: "ランニング",
		icon: "🏃",
		defaultFrequency: "daily",
		defaultEffect: { type: "distance", unit: "km" },
	},
	{
		id: "3",
		name: "読書",
		icon: "📚",
		defaultFrequency: "daily",
		defaultEffect: { type: "duration", unit: "分" },
	},
	{
		id: "4",
		name: "瞑想",
		icon: "🧘",
		defaultFrequency: "daily",
		defaultEffect: { type: "duration", unit: "分" },
	},
	{
		id: "5",
		name: "早起き",
		icon: "⏰",
		defaultFrequency: "daily",
		defaultEffect: { type: "time", unit: "" },
	},
];

const HabitSelectionScreen = () => {
	const [customHabit, setCustomHabit] = useState("");
	const router = useRouter();

	const handleHabitSelect = (habit) => {
		router.push({
			pathname: "/habit-details",
			params: { habit: JSON.stringify(habit) },
		});
	};

	const handleCustomHabitSubmit = () => {
		if (customHabit.trim()) {
			handleHabitSelect({ name: customHabit, defaultFrequency: "daily" });
		}
	};

	const renderHabitItem = ({ item }) => (
		<ListItem bottomDivider onPress={() => handleHabitSelect(item)}>
			<Text style={styles.habitIcon}>{item.icon}</Text>
			<ListItem.Content>
				<ListItem.Title>{item.name}</ListItem.Title>
			</ListItem.Content>
			<ListItem.Chevron />
		</ListItem>
	);

	return (
		<View style={styles.container}>
			<Text style={styles.title}>何を習慣にしますか？</Text>
			<Input
				placeholder="習慣名を入力"
				value={customHabit}
				onChangeText={setCustomHabit}
				rightIcon={
					<Button
						title="登録"
						onPress={handleCustomHabitSubmit}
						disabled={!customHabit.trim()}
					/>
				}
			/>
			<Text style={styles.subtitle}>よくある習慣</Text>
			<FlatList
				data={predefinedHabits}
				renderItem={renderHabitItem}
				keyExtractor={(item) => item.id}
			/>
		</View>
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
	subtitle: {
		fontSize: 18,
		fontWeight: "bold",
		marginTop: 20,
		marginBottom: 10,
	},
	habitIcon: {
		fontSize: 24,
		marginRight: 10,
	},
});

export default HabitSelectionScreen;
