import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Text, Overlay } from '@rneui/themed';
import { supabase } from '../libs/supabase';

export const RecalculateStatsButton = () => {
  const [loading, setLoading] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [resultMessage, setResultMessage] = useState('');

  const handleRecalculate = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.rpc('calculate_habit_statistics');
      
      if (error) throw error;
      
      setResultMessage('統計情報を更新しました');
      setShowOverlay(true);
    } catch (error) {
      if (error instanceof Error) {
        setResultMessage(error.message);
      } else {
        setResultMessage('統計情報の更新に失敗しました');
      }
      setShowOverlay(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ marginBottom: 8, textAlign: 'center', color: '#666' }}>
        ※ 統計情報は毎日深夜1時に自動更新されます
      </Text>
      <Text style={{ marginBottom: 8, textAlign: 'center', color: '#666' }}>
        ※ 1日1回のみ手動で更新できます
      </Text>
      
      <Button
        title="統計を更新する"
        onPress={handleRecalculate}
        loading={loading}
        buttonStyle={{
          backgroundColor: '#6366f1',
          borderRadius: 8,
        }}
        containerStyle={{
          width: '100%',
        }}
        titleStyle={{
          fontWeight: 'bold',
        }}
      />

      <Overlay
        isVisible={showOverlay}
        onBackdropPress={() => setShowOverlay(false)}
        overlayStyle={{
          padding: 24,
          borderRadius: 12,
          width: '80%',
        }}
      >
        <View>
          <Text style={{ 
            textAlign: 'center',
            marginBottom: 16,
            fontSize: 16,
          }}>
            {resultMessage}
          </Text>
          <Button
            title="閉じる"
            onPress={() => setShowOverlay(false)}
            buttonStyle={{
              backgroundColor: '#6366f1',
              borderRadius: 8,
            }}
          />
        </View>
      </Overlay>
    </View>
  );
};