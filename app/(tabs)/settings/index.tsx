import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ListItem } from '@rneui/themed';
import { Linking } from 'react-native';

export default function Settings() {
	const openPrivacyPolicy = () => {
		Linking.openURL('https://legal.omochi-tech.com/habitore/privacy.html');
	};
 
	const openTerms = () => {
		Linking.openURL('https://legal.omochi-tech.com/habitore/terms.html');
	};
 

	
	return (
		<SafeAreaView>
			     <ListItem 
       onPress={openPrivacyPolicy}
       bottomDivider
     >
       <ListItem.Content>
         <ListItem.Title>プライバシーポリシー</ListItem.Title>
       </ListItem.Content>
       <ListItem.Chevron />
     </ListItem>

     <ListItem 
       onPress={openTerms}
       bottomDivider
     >
       <ListItem.Content>
         <ListItem.Title>利用規約</ListItem.Title>
       </ListItem.Content>
       <ListItem.Chevron />
     </ListItem>
		</SafeAreaView>
	);
}
