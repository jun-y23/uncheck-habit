import { Button, Icon, Input, ListItem, Text } from "@rneui/themed";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { useHabitTemplates } from "../hooks/useHabitTemplates";

const HabitSelectionScreen = () => {
	const [customHabit, setCustomHabit] = useState("");
	const router = useRouter();

	const { templates, loading, error } = useHabitTemplates();

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
				data={templates}
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
