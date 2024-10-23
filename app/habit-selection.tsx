import { Button, Icon, Input, ListItem, Text } from "@rneui/themed";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
	FlatList,
	ScrollView,
	StyleSheet,
	TouchableOpacity,
	View,
} from "react-native";
import { supabase } from "../libs/supabase";

interface Habit {
	id: string;
	name: string;
	icon: string;
}

const HabitSelectionScreen = () => {
	const [customHabit, setCustomHabit] = useState("");
	const [habitTemplates, setHabitTemplates] = useState<Habit[]>([]);
	const router = useRouter();

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

		setHabitTemplates(fetchedHabits);
	};

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
			<Icon name={item.icon} />
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
				data={habitTemplates}
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
