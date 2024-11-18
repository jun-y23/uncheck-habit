import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  TextInput,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Text, Button, Icon, Dialog } from '@rneui/themed';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../libs/supabase';

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'achieved':
      return '#4CAF50';
    case 'not_achieved':
      return '#FF5252';
    default:
      return '#E0E0E0';
  }
};


interface HabitDetailScreenProps {
  id: string;
}

export const HabitDetail: React.FC<HabitDetailScreenProps> = (props: HabitDetailScreenProps) => {
  const navigation = useNavigation();
  
  const { id } = props

  const [habit, setHabit] = useState<any>();

  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogVisible, setIsDeleteDialogVisible] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 習慣名の更新
  const updateHabitName = async () => {
    try {
      const { error } = await supabase
        .from('habits')
        .update({ name })
        .eq('id', id);

      if (error) throw error;

      setIsEditing(false);
    } catch (error) {
      Alert.alert('エラー', '名前の更新に失敗しました');
    }
  };

  // 習慣の削除
  const deleteHabit = async () => {
    try {
      const { error } = await supabase
        .from('habits')
        .update({ is_archived: true })
        .eq('id', id);

      if (error) throw error;

      navigation.goBack();
    } catch (error) {
      Alert.alert('エラー', '削除に失敗しました');
    }
  };

  const fetchHabit = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('id', id)

      if (error) throw error;
      console.log('data:', error);

      setHabit(data);
    } catch (error) {
      console.log('data:', error);
      Alert.alert('エラー', 'データの取得に失敗しました');
    }
  }, [id]);

  // 月単位のログ取得
  const fetchMonthLogs = useCallback(async (date: Date) => {
    try {
      setIsLoading(true);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      
      const { data, error } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('habit_id', id)
        .gte('date', format(start, 'yyyy-MM-dd'))
        .lte('date', format(end, 'yyyy-MM-dd'))
        .order('date');

      if (error) throw error;

      // 日付の配列を生成
      const daysInMonth = eachDayOfInterval({ start, end });
      
      // ログデータをマップ
      const mappedLogs = daysInMonth.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const log = data?.find(l => l.date === dateStr);
        return {
          date: dateStr,
          status: log?.status || 'unchecked',
          notes: log?.notes || '',
        };
      });

      setLogs(mappedLogs);
    } catch (error) {
      Alert.alert('エラー', 'ログの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  // 月を変更
  const changeMonth = (increment: number) => {
    const newMonth = new Date(selectedMonth.setMonth(selectedMonth.getMonth() + increment));
    setSelectedMonth(newMonth);
    fetchMonthLogs(newMonth);
  };

  // カレンダーグリッド表示
  const renderCalendar = () => {
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);
    const days = eachDayOfInterval({ start, end });

    return (
      <View style={styles.calendar}>
        {days.map((day, index) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const log = logs.find(l => l.date === dateStr);
          
          return (
            <TouchableOpacity
              key={dateStr}
              style={[
                styles.calendarCell,
                { backgroundColor: getStatusColor(log?.status) }
              ]}
              onPress={() => handleDayPress(dateStr, log)}
            >
              <Text style={styles.dayText}>{format(day, 'd')}</Text>
              {log?.notes && (
                <Icon
                  name="note"
                  size={12}
                  color="#666"
                  style={styles.noteIcon}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  React.useEffect(() => {
    fetchMonthLogs(selectedMonth);
  }, [fetchMonthLogs, selectedMonth]);

  React.useEffect(() => {
    fetchHabit();
  }, [fetchHabit]);

  if (!habit) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <ScrollView style={styles.container}>
      {/* 習慣名編集セクション */}
      <View style={styles.nameSection}>
        {isEditing ? (
          <View style={styles.editContainer}>
            <TextInput
              value={habit.name}
              onChangeText={() => {}}
              style={styles.nameInput}
              autoFocus
            />
            <Button
              title="保存"
              onPress={updateHabitName}
              buttonStyle={styles.saveButton}
            />
          </View>
        ) : (
          <View style={styles.nameContainer}>
            <Text style={styles.nameText}>{habit.name}</Text>
            <Icon
              name="edit"
              onPress={() => setIsEditing(true)}
              containerStyle={styles.editIcon}
            />
          </View>
        )}
      </View>

      {/* 月選択セクション */}
      <View style={styles.monthSelector}>
        <Icon
          name="chevron-left"
          onPress={() => changeMonth(-1)}
        />
        <Text style={styles.monthText}>
          {format(selectedMonth, 'yyyy年M月', { locale: ja })}
        </Text>
        <Icon
          name="chevron-right"
          onPress={() => changeMonth(1)}
        />
      </View>

      {/* カレンダー表示 */}
      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        renderCalendar()
      )}

      {/* 削除ボタン */}
      <Button
        title="習慣を削除"
        onPress={() => setIsDeleteDialogVisible(true)}
        buttonStyle={styles.deleteButton}
        type="outline"
      />

      {/* 削除確認ダイアログ */}
      <Dialog
        isVisible={isDeleteDialogVisible}
        onBackdropPress={() => setIsDeleteDialogVisible(false)}
      >
        <Dialog.Title title="習慣の削除" />
        <Text>本当にこの習慣を削除しますか？</Text>
        <Dialog.Actions>
          <Dialog.Button
            title="キャンセル"
            onPress={() => setIsDeleteDialogVisible(false)}
          />
          <Dialog.Button
            title="削除"
            onPress={deleteHabit}
            titleStyle={{ color: 'red' }}
          />
        </Dialog.Actions>
      </Dialog>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  nameSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameText: {
    fontSize: 24,
    fontWeight: '600',
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameInput: {
    flex: 1,
    fontSize: 24,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    marginRight: 8,
  },
  editIcon: {
    padding: 8,
  },
  saveButton: {
    paddingHorizontal: 16,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F5F5F5',
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
  },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  calendarCell: {
    width: (Dimensions.get('window').width - 32) / 7,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderRadius: 4,
  },
  dayText: {
    fontSize: 16,
  },
  noteIcon: {
    position: 'absolute',
    bottom: 4,
    right: 4,
  },
  deleteButton: {
    margin: 16,
    borderColor: 'red',
  },
});

