import React, { useCallback, useRef } from 'react';
import { StyleSheet, View, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { Button, Input, Text } from '@rneui/themed';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import BottomSheet from '@gorhom/bottom-sheet';
import { useToggleStatus } from '../hooks/useHabitLogs';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const habitLogSchema = z.object({
  logID: z.string().optional(),
  habitID: z.string(),
  status: z.enum(['unchecked', 'achieved', 'not_achieved']),
  date: z.date(),
  notes: z.string().max(200, 'メモは200文字以内で入力してください').optional(),
});

const habitLogFormSchema = habitLogSchema.omit({ logID: true, date: true, habitID: true });

export type HabitLogData = z.infer<typeof habitLogSchema>;
export type HabitLogFormData = z.infer<typeof habitLogFormSchema>;

interface CalendarOverlayProps {
  isVisible: boolean;
  initialData: HabitLogData | null;
  onClose: () => void;
}

const CalendarOverlay: React.FC<CalendarOverlayProps> = ({
  isVisible,
  initialData,
  onClose,
}) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const { toggleStatus } = useToggleStatus(initialData?.habitID);

  const { control, handleSubmit, reset } = useForm<HabitLogFormData>({
    resolver: zodResolver(habitLogFormSchema),
    values: {
      status: initialData?.status,
      notes: initialData?.notes,
    }
  });

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);

  const onSubmit = async (data: HabitLogFormData) => {
    if (!initialData?.habitID || !initialData?.date) return;

    const habitLogData = {
      ...data,
      notes: data.notes || '',
      logID: initialData?.logID || undefined,
      habitID: initialData.habitID,
      date: initialData.date,
    };

    await toggleStatus(habitLogData);
    reset();
    onClose();
  };

  if (!isVisible) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>
      
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={['50%']}
        enablePanDownToClose
        onClose={onClose}
        onChange={handleSheetChanges}
        index={0}
        style={styles.bottomSheet}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
      >
        <View style={styles.contentContainer}>
          <Text h4 style={styles.dateText}>
            {initialData?.date
              ? format(initialData.date, "M月d日（E）", { locale: ja })
              : ""}
          </Text>

          <Controller
            control={control}
            name="status"
            render={({ field: { onChange, value } }) => (
              <View style={styles.statusButtons}>
                <Button
                  title="未達成"
                  onPress={() => onChange("not_achieved")}
                  type={value === "not_achieved" ? "solid" : "outline"}
                  buttonStyle={[
                    styles.statusButton,
                    value === "not_achieved" && styles.notAchievedButton
                  ]}
                />
                <Button
                  title="達成"
                  onPress={() => onChange("achieved")}
                  type={value === "achieved" ? "solid" : "outline"}
                  buttonStyle={[
                    styles.statusButton,
                    value === "achieved" && styles.achievedButton
                  ]}
                />
                <Button
                  title="未チェック"
                  onPress={() => onChange("unchecked")}
                  type={value === "unchecked" ? "solid" : "outline"}
                  buttonStyle={styles.statusButton}
                />
              </View>
            )}
          />

          <Controller
            control={control}
            name="notes"
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <Input
                placeholder="メモを入力"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                multiline
                maxLength={200}
                errorMessage={error?.message}
                containerStyle={styles.memoInput}
              />
            )}
          />

          <Button
            title="保存"
            onPress={handleSubmit(onSubmit)}
            buttonStyle={styles.saveButton}
          />
        </View>
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    zIndex: 999,
    elevation: 999,
  },
  bottomSheetBackground: {
    backgroundColor: 'white',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  handleIndicator: {
    backgroundColor: '#00000030',
    width: 40,
    height: 4,
  },
  dateText: {
    textAlign: 'center',
    marginVertical: 16,
  },
  statusButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 15,
  },
  statusButton: {
    paddingHorizontal: 10,
    minWidth: 100,
  },
  achievedButton: {
    backgroundColor: '#4CAF50',
  },
  notAchievedButton: {
    backgroundColor: '#F44336',
  },
  memoInput: {
    marginBottom: 15,
  },
  saveButton: {
    marginTop: 10,
    backgroundColor: '#2196F3',
  },
});

export default CalendarOverlay;