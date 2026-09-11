import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { BackHandler, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { releaseLock } from '@/alarm/lock';
import { Button, Screen, Text } from '@/components/ui';
import { MissionRun } from '@/missions/run';
import { useStore } from '@/store';
import type { LockState } from '@/store/types';
import { spacing, useTheme } from '@/theme';
import { formatClock } from '@/utils/format';

function distanceM(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Post-alarm lock screen: other apps stay blocked until the unlock rule is satisfied. */
export default function LockedScreen() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const lock = useStore((s) => s.lock);
  const use24h = useStore((s) => s.settings.use24h);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  // Deadline reached (time rule or hard cap) → release.
  useEffect(() => {
    if (lock && now >= lock.until) release();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, lock]);

  useEffect(() => {
    if (!lock) router.replace('/');
  }, [lock, router]);

  const release = () => {
    releaseLock();
    router.replace('/');
  };

  if (!lock) return null;
  const left = Math.max(0, lock.until - now);
  const mm = Math.floor(left / 60000), ss = Math.floor((left % 60000) / 1000);

  return (
    <Screen style={{ paddingHorizontal: spacing.lg }}>
      <View style={{ alignItems: 'center', paddingTop: spacing.xxl, gap: spacing.sm }}>
        <Ionicons name="lock-closed" size={40} color={t.text} />
        <Text variant="title">{tr('lock.title')}</Text>
        <Text variant="muted" style={{ textAlign: 'center' }}>{tr(`lock.hint_${lock.rule.kind}`)}</Text>
      </View>

      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        {lock.rule.kind === 'time' ? (
          <View style={{ alignItems: 'center' }}>
            <Text variant="muted">{tr('editor.unlockTime')}</Text>
            <Text variant="time" style={{ fontSize: 72 }}>{formatClock(lock.rule.hour, lock.rule.minute, use24h).time}</Text>
            <Text variant="muted" style={{ fontVariant: ['tabular-nums'] }}>{`${mm}:${ss.toString().padStart(2, '0')}`}</Text>
          </View>
        ) : null}
        {lock.rule.kind === 'mission' ? <LockMissions lock={lock} onDone={release} fg={t.text} /> : null}
        {lock.rule.kind === 'location' ? <LockLocation lock={lock} onDone={release} /> : null}
      </View>

      <View style={{ alignItems: 'center', gap: spacing.sm, paddingBottom: spacing.md }}>
        <Text variant="caption">{tr('lock.autoUnlock', { count: mm })}</Text>
        {__DEV__ ? <Button title={tr('ring.skipDev')} kind="ghost" onPress={release} /> : null}
      </View>
    </Screen>
  );
}

function LockMissions({ lock, onDone, fg }: { lock: LockState; onDone: () => void; fg: string }) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  if (lock.rule.kind !== 'mission') return null;
  const missions = lock.rule.missions;
  const mission = missions[index];
  if (!mission) return null;
  return (
    <View style={{ width: '100%', alignItems: 'center', gap: spacing.sm }}>
      <Text variant="caption">{t('ring.missionOf', { n: index + 1, total: missions.length })}</Text>
      <MissionRun
        key={mission.id}
        mission={mission}
        onActivity={() => {}}
        onComplete={() => (index + 1 >= missions.length ? onDone() : setIndex(index + 1))}
        soundOn={false}
        fg={fg}
      />
    </View>
  );
}

function LockLocation({ lock, onDone }: { lock: LockState; onDone: () => void }) {
  const { t } = useTranslation();
  const [distance, setDistance] = useState<number | null>(null);
  const [denied, setDenied] = useState(false);
  const rule = lock.rule;

  useEffect(() => {
    if (rule.kind !== 'location') return;
    let sub: Location.LocationSubscription | null = null;
    (async () => {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) return setDenied(true);
      sub = await Location.watchPositionAsync({ accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 5 }, (loc) => {
        const d = distanceM(loc.coords, { latitude: rule.lat, longitude: rule.lng });
        setDistance(d);
        const satisfied = rule.mode === 'leaveHome' ? d > rule.radiusM : d < rule.radiusM;
        if (satisfied) onDone();
      });
    })();
    return () => sub?.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (rule.kind !== 'location') return null;
  return (
    <View style={{ alignItems: 'center', gap: spacing.sm }}>
      <Ionicons name={rule.mode === 'leaveHome' ? 'home-outline' : 'business-outline'} size={48} color="#888" />
      <Text variant="heading">{t(`editor.${rule.mode}`)}</Text>
      <Text variant="muted">{denied ? t('ring.permissionLocation') : distance === null ? t('lock.locating') : t('lock.distance', { m: Math.round(distance), r: rule.radiusM })}</Text>
    </View>
  );
}
