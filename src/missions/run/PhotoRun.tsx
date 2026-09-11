import { CameraView } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, Text } from '@/components/ui';
import type { PhotoMission } from '@/store/types';
import { radius, spacing } from '@/theme';

import { CameraGate } from './CameraPermission';
import type { MissionRunProps } from './types';

const MIN_DISTANCE_M = 30;

function distanceM(a: Location.LocationObjectCoords, b: Location.LocationObjectCoords) {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Outdoor photo: the user must take a picture. With GPS verification on, the
 * position at the moment of taking the photo must be >= 30 m away from where
 * the mission started (i.e. where they were sleeping).
 */
export function PhotoRun({ mission, onActivity, onComplete, fg }: MissionRunProps<PhotoMission>) {
  const { t } = useTranslation();
  const cam = useRef<CameraView>(null);
  const start = useRef<Location.LocationObjectCoords | null>(null);
  const [status, setStatus] = useState<'idle' | 'checking' | 'fail'>('idle');
  const [gpsAvailable, setGpsAvailable] = useState(false);

  useEffect(() => {
    if (!mission.requireOutdoors) return;
    (async () => {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) return;
      setGpsAvailable(true);
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }).catch(() => null);
      if (loc) start.current = loc.coords;
    })();
  }, [mission.requireOutdoors]);

  const take = async () => {
    if (status === 'checking') return;
    onActivity();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await cam.current?.takePictureAsync({ quality: 0.3, skipProcessing: true });
    } catch {}
    if (!mission.requireOutdoors || !gpsAvailable) return finish();
    setStatus('checking');
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }).catch(() => null);
    if (!loc) return finish();
    if (!start.current) {
      start.current = loc.coords;
      setStatus('fail');
      return;
    }
    if (distanceM(start.current, loc.coords) >= MIN_DISTANCE_M) finish();
    else setStatus('fail');
  };

  const finish = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onComplete();
  };

  return (
    <View style={{ flex: 1, alignItems: 'center', gap: spacing.md, width: '100%' }}>
      <CameraGate fg={fg}>
        <View style={styles.frame}>
          <CameraView ref={cam} style={StyleSheet.absoluteFill} facing="back" />
        </View>
      </CameraGate>
      {status === 'checking' ? (
        <Text style={{ color: fg }}>{t('ring.photoChecking')}</Text>
      ) : status === 'fail' ? (
        <>
          <Text style={{ color: '#FF6369', textAlign: 'center', paddingHorizontal: spacing.lg }}>{t('ring.photoNotOutside')}</Text>
          <Button title={t('ring.photoRetake')} kind="secondary" onPress={() => setStatus('idle')} />
        </>
      ) : (
        <Pressable onPress={take} style={({ pressed }) => [styles.shutter, { borderColor: fg, opacity: pressed ? 0.6 : 1 }]}>
          <View style={[styles.shutterInner, { backgroundColor: fg }]} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: 300, aspectRatio: 3 / 4, borderRadius: radius.lg, overflow: 'hidden' },
  shutter: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 56, height: 56, borderRadius: 28 },
});
