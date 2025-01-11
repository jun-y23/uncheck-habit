import { ListItem } from "@rneui/themed";
import { Link } from "expo-router";
import { Pressable, StyleSheet } from "react-native";
import { Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Settings() {
	const openPrivacyPolicy = () => {
		Linking.openURL("https://legal.omochi-tech.com/habitora/privacy.html");
	};

	const openTerms = () => {
		Linking.openURL("https://legal.omochi-tech.com/habitora/terms.html");
	};

	const openContact = () => {
		Linking.openURL("https://forms.gle/YdAtb3jFyXqKT7UFA");
	};

	return (
		<SafeAreaView>
			<ListItem onPress={openPrivacyPolicy} bottomDivider>
				<ListItem.Content>
					<ListItem.Title>プライバシーポリシー</ListItem.Title>
				</ListItem.Content>
				<ListItem.Chevron />
			</ListItem>

			<ListItem onPress={openTerms} bottomDivider>
				<ListItem.Content>
					<ListItem.Title>利用規約</ListItem.Title>
				</ListItem.Content>
				<ListItem.Chevron />
			</ListItem>

			<ListItem onPress={openContact} bottomDivider>
				<ListItem.Content>
					<ListItem.Title>お問い合わせ</ListItem.Title>
				</ListItem.Content>
				<ListItem.Chevron />
			</ListItem>

			<ListItem containerStyle={styles.deleteAccount}>
				<ListItem.Content>
					<Link href="/settings/delete-account" asChild>
						<Pressable>
							<ListItem.Title style={styles.deleteText}>
								アカウントを削除
							</ListItem.Title>
						</Pressable>
					</Link>
				</ListItem.Content>
			</ListItem>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	deleteAccount: {
		marginTop: "auto",
		marginBottom: 20,
		backgroundColor: "transparent",
	},
	deleteText: {
		color: "#FF3B30",
		textAlign: "center",
	},
});
