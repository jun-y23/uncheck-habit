import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface DatePickerFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  errorMessage?: string;
  minDate?: Date;
  maxDate?: Date;
}

export const DatePickerField = <T extends FieldValues>({
  control,
  name,
  label,
  errorMessage,
  minDate,
  maxDate,
}: DatePickerFieldProps<T>) => {
  const [showPicker, setShowPicker] = useState(false);

  const handleDateChange = (
    onChange: (date: Date) => void,
    event: any,
    selectedDate?: Date
  ) => {
    setShowPicker(Platform.OS === 'ios');
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <View style={styles.container}>
          {label && <Text style={styles.label}>{label}</Text>}
          <DateTimePicker
              value={value || new Date()}
              mode="date"
              display={'compact'}
              onChange={(event, date) => handleDateChange(onChange, event, date)}
              locale="ja-JP"
              minimumDate={minDate}
              maximumDate={maxDate}
            />
          
          {/* <TouchableOpacity
            style={[
              styles.dateButton,
              error && styles.errorBorder
            ]}
            onPress={() => setShowPicker(true)}
          >
            <Text style={[
              styles.dateText,
              error && styles.errorText
            ]}>
              {value
                ? format(new Date(value), 'yyyy年MM月dd日', { locale: ja })
                : '日付を選択'}
            </Text>
          </TouchableOpacity> */}

          {error && (
            <Text style={styles.errorMessage}>
              {errorMessage || error.message}
            </Text>
          )}

        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  dateButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  errorBorder: {
    borderColor: '#ff4444',
  },
  errorText: {
    color: '#ff4444',
  },
  errorMessage: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
  },
});