import { Button, Text } from "@rneui/themed";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { supabase } from "../../../libs/supabase";

export default function DeleteAccountScreen() {
	const [isDeleting, setIsDeleting] = useState(false);

	const handleDeleteAccount = async () => {
		Alert.alert(
			"アカウントの削除",
			"すべてのデータが削除されます。この操作は取り消せません。",
			[
				{ text: "キャンセル", style: "cancel" },
				{
					text: "削除",
					style: "destructive",
					onPress: async () => {
						try {
							setIsDeleting(true);
							const { error } = await supabase.rpc("delete_user_data");
							if (error) throw error;

							await supabase.auth.signOut();
							router.replace("/");
						} catch (error) {
							Alert.alert("エラー", "アカウントの削除に失敗しました");
						} finally {
							setIsDeleting(false);
						}
					},
				},
			],
		);
	};

	return (
		<View style={styles.container}>
			<Text style={styles.warning}>
				アカウントを削除すると、以下のデータがすべて削除されます：
			</Text>
			<View style={styles.list}>
				<Text>• 登録された習慣</Text>
				<Text>• 記録された達成状況</Text>
				<Text>• その他のすべての個人データ</Text>
			</View>
			<Text style={styles.note}>この操作は取り消すことができません。</Text>

			<View style={styles.buttonsContainer}>
				<Button
					title="キャンセル"
					onPress={() => router.back()}
					containerStyle={styles.cancelButtonContainer}
				/>

				<Button
					title="アカウントを削除"
					onPress={handleDeleteAccount}
					loading={isDeleting}
					buttonStyle={styles.deleteButton}
					titleStyle={styles.deleteButtonText}
				/>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
	},
	warning: {
		fontSize: 16,
		color: "#FF3B30",
		marginBottom: 16,
	},
	list: {
		marginBottom: 16,
	},
	note: {
		fontSize: 14,
		color: "#666",
		marginBottom: 24,
	},
	deleteButton: {
		backgroundColor: "#FF3B30",
		paddingVertical: 12,
	},
	deleteButtonText: {
		fontSize: 16,
	},
	buttonsContainer: {
		gap: 20,
	},

	cancelButtonContainer: {
		marginTop: 20,
	},
});
