import { CameraView } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { StyleSheet, Text as RNText, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, Text } from '@/components/ui';
import { usePoseCounter } from '@/missions/fitness/usePoseCounter';
import { missionMeta } from '@/missions/registry';
import type { FitnessMission } from '@/store/types';
import { radius, spacing } from '@/theme';

import { CameraGate } from './CameraPermission';
import type { MissionRunProps } from './types';

/**
 * Fitness mission UI. The rep counting itself lives in missions/fitness and is
 * driven by the native pose detector (phase 3). Until that build exists the
 * screen shows the camera preview and an explanatory hint.
 */
export function FitnessRun({ mission, onActivity, onComplete, fg }: MissionRunProps<FitnessMission>) {
  const { t } = useTranslation();
  const idleMs = missionMeta('fitness').idleGraceSec * 1000;
  const pose = usePoseCounter(mission.exercise, idleMs);
  const lastCount = useRef(0);

  // Every counted rep (and any detected motion) keeps the alarm silent.
  useEffect(() => {
    if (pose.active) onActivity();
  }, [pose.active, pose.count, onActivity]);

  useEffect(() => {
    if (pose.count !== lastCount.current) {
      lastCount.current = pose.count;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (pose.count >= mission.reps) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onComplete();
      }
    }
  }, [pose.count, mission.reps, onComplete]);

  const hint = !pose.supported
    ? t('ring.fitnessNativeRequired')
    : !pose.visible
      ? t('ring.fitnessDetecting')
      : pose.active
        ? t('ring.fitnessGo')
        : pose.count === 0
          ? t('ring.fitnessGetReady')
          : t('ring.fitnessPaused');

  return (
    <View style={{ flex: 1, alignItems: 'center', gap: spacing.md, width: '100%' }}>
      <Text variant="caption" style={{ color: fg, opacity: 0.7 }}>{t(`missions.${mission.exercise}`)}</Text>
      <RNText style={[styles.counter, { color: fg }]}>
        {pose.count}
        <RNText style={{ fontSize: 28, opacity: 0.5 }}> / {mission.reps}</RNText>
      </RNText>
      <CameraGate fg={fg}>
        <View style={styles.frame}>
          <CameraView style={StyleSheet.absoluteFill} facing="front" />
        </View>
      </CameraGate>
      <Text style={{ color: fg, textAlign: 'center', paddingHorizontal: spacing.lg }}>{hint}</Text>
      {__DEV__ && !pose.supported ? <Button title={t('ring.skipDev')} kind="secondary" onPress={onComplete} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  counter: { fontSize: 72, fontWeight: '200', letterSpacing: -2, fontVariant: ['tabular-nums'] },
  frame: { width: 260, aspectRatio: 3 / 4, borderRadius: radius.lg, overflow: 'hidden' },
});
