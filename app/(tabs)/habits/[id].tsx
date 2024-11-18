import { useLocalSearchParams } from 'expo-router';
import { HabitDetail } from '../../../components/HabitDetail';

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  
  return <HabitDetail id={id}/>;
}
