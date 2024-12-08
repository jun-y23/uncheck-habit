import React from "react";
import {
	View,
	Text,
	StyleSheet,
	Dimensions,
	FlatList,
	ActivityIndicator,
	RefreshControl,
} from "react-native";
import { Button } from "@rneui/themed";
import { useHabitStatistics } from "../hooks/useHabitStatistics";
import { HabitCard } from "./HabitCard";

const { width } = Dimensions.get("window");
const CARD_MARGIN = 8;
const CARD_WIDTH = (width - CARD_MARGIN * 4) / 2;

export const HabitList: React.FC = () => {
	const { statistics, isLoading, error, refetch } = useHabitStatistics();

	if (isLoading) {
		return <ActivityIndicator />;
	}

	if (error) {
		return (
			<View style={styles.errorContainer}>
				<Text style={styles.errorText}>データの取得に失敗しました</Text>
				<Button title="再試行" onPress={refetch} />
			</View>
		);
	}

	return (
		<FlatList
			data={statistics}
			renderItem={({ item }) => <HabitCard habit={item} />}
			keyExtractor={(item) => item.id}
			numColumns={2}
			contentContainerStyle={styles.listContainer}
			columnWrapperStyle={styles.columnWrapper}
			refreshControl={
				<RefreshControl refreshing={isLoading} onRefresh={refetch} />
			}
		/>
	);
};

const styles = StyleSheet.create({
	// List styles
	listContainer: {
		padding: CARD_MARGIN,
	},
	columnWrapper: {
		justifyContent: "space-between",
	},
	errorContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
	},
	errorText: {
		color: "#FF5252",
		marginBottom: 16,
	},
});
