import { Stack } from 'expo-router/stack';
import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function Layout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="index" options={{
        headerShown: true, // ヘッダーを表示
        headerTitle: '設定', // ヘッダータイトルを非表示
      }} />
      <Stack.Screen name="delete-account" options={{  

      }} />
    </Stack>
  );
}