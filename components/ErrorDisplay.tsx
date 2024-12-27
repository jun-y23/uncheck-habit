import React from 'react';
import { View } from 'react-native';
import { Text, Button } from '@rneui/themed';
import { ErrorType, AppError } from '../types/error';

interface ErrorDisplayProps {
  error: AppError;
  onRetry?: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onRetry }) => {
  const getErrorMessage = (error: AppError) => {
    switch (error.type) {
      case ErrorType.NETWORK_ERROR:
        return {
          title: 'ネットワークエラー',
          message: 'インターネット接続を確認してください'
        };
      case ErrorType.AUTHENTICATION:
        return {
          title: '認証エラー',
          message: '再度ログインしてください'
        };
      default:
        return {
          title: 'エラー',
          message: error.message
        };
    }
  };

  const { title, message } = getErrorMessage(error);

  return (
    <View style={{ padding: 16 }}>
      <Text h4>{title}</Text>
      <Text style={{ marginVertical: 8 }}>{message}</Text>
      {onRetry && (
        <Button
          title="再試行"
          onPress={onRetry}
          type="outline"
        />
      )}
    </View>
  );
};
