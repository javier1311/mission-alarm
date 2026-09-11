import { CameraView } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/ui';
import type { BarcodeMission } from '@/store/types';
import { radius, spacing } from '@/theme';

import { CameraGate } from './CameraPermission';
import type { MissionRunProps } from './types';

export function BarcodeRun({ mission, onComplete, fg }: MissionRunProps<BarcodeMission>) {
  const { t } = useTranslation();
  const [wrong, setWrong] = useState(false);
  const done = useRef(false);
  const lastWrong = useRef(0);

  return (
    <View style={{ flex: 1, alignItems: 'center', gap: spacing.md }}>
      <Text style={{ color: fg, textAlign: 'center' }}>{mission.label || t('ring.barcodeHint')}</Text>
      <CameraGate fg={fg}>
        <View style={[styles.frame, wrong && { borderColor: '#FF6369' }]}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            onBarcodeScanned={({ data }) => {
              if (done.current) return;
              if (data === mission.code) {
                done.current = true;
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                onComplete();
              } else if (Date.now() - lastWrong.current > 1500) {
                lastWrong.current = Date.now();
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                setWrong(true);
                setTimeout(() => setWrong(false), 1200);
              }
            }}
          />
        </View>
      </CameraGate>
      <Text style={{ color: wrong ? '#FF6369' : 'transparent' }}>{t('ring.wrongCode')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: 280,
    height: 280,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
});
