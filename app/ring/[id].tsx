import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useKeepAwake } from 'expo-keep-awake';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text as RNText, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AlarmNative } from '@modules/alarm-native';
import { finishRingLock, startRingLock } from '@/alarm/lock';
import { rescheduleAll } from '@/alarm/scheduler';
import { useRingSession } from '@/alarm/useRingSession';
import { Text } from '@/components/ui';
import { wallpaperById } from '@/data/wallpapers';
import { missionMeta } from '@/missions/registry';
import { MissionRun } from '@/missions/run';
import { useStore } from '@/store';
import { radius, spacing } from '@/theme';
import { formatClock } from '@/utils/format';

export default function RingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const alarm = useStore((s) => s.alarms.find((a) => a.id === id));
  const router = useRouter();
  const setActiveAlarm = useStore((s) => s.setActiveAlarm);

  useEffect(() => {
    if (!alarm) {
      setActiveAlarm(null);
      router.replace('/');
    }
  }, [alarm, router, setActiveAlarm]);

  if (!alarm) return null;
  return <Ring alarmId={alarm.id} />;
}

function Ring({ alarmId }: { alarmId: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  useKeepAwake();

  // Snapshot the alarm for the whole session so edits mid-ring don't break the flow.
  const alarm = useMemo(() => useStore.getState().alarms.find((a) => a.id === alarmId)!, [alarmId]);
  const use24h = useStore((s) => s.settings.use24h);
  const customWallpapers = useStore((s) => s.customWallpapers);
  const setActiveAlarm = useStore((s) => s.setActiveAlarm);
  const [now, setNow] = useState(new Date());

  const onFinished = useCallback(() => {
    setActiveAlarm(null);
    finishRingLock(alarm);
    rescheduleAll(useStore.getState().alarms); // next occurrence of repeating alarms
    const locked = !!useStore.getState().lock;
    setTimeout(() => router.replace(locked ? '/locked' : '/'), 1600);
  }, [alarm, router, setActiveAlarm]);

  const { state, startMission, activity, completeMission } = useRingSession(alarm, onFinished);

  // Native: show over lock screen, drop the full-screen notification, lock other apps.
  useEffect(() => {
    AlarmNative.showOverLockScreen(true);
    AlarmNative.dismissNotification();
    AlarmNative.stop(alarm.id);
    startRingLock(alarm);
    return () => AlarmNative.showOverLockScreen(false);
  }, [alarm]);

  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  // Hardware back must not dismiss the alarm.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => state.phase !== 'done');
    return () => sub.remove();
  }, [state.phase]);

  const wp = wallpaperById(alarm.wallpaperId);
  const customWp = customWallpapers.find((w) => w.id === alarm.wallpaperId);
  const dark = wp ? wp.dark : true;
  const fg = dark ? '#FFFFFF' : '#111113';
  const clock = formatClock(now.getHours(), now.getMinutes(), use24h);
  const mission = alarm.missions[state.missionIndex];

  return (
    <View style={{ flex: 1, backgroundColor: dark ? '#0B0B0D' : '#FFFFFF' }}>
      <Image source={customWp ? { uri: customWp.uri } : wp?.source} style={StyleSheet.absoluteFill} contentFit="cover" />
      {customWp ? <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.35)' }]} /> : null}

      <View style={{ flex: 1, paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg, paddingHorizontal: spacing.lg }}>
        {/* Top: clock + status */}
        <View style={{ alignItems: 'center' }}>
          <RNText style={[styles.clock, { color: fg, fontSize: state.phase === 'ringing' ? 96 : 40 }]}>
            {clock.time}
            {clock.suffix ? <RNText style={{ fontSize: 24 }}> {clock.suffix}</RNText> : null}
          </RNText>
          {alarm.label ? <Text style={{ color: fg, opacity: 0.8, fontSize: 18 }}>{alarm.label}</Text> : null}
          {state.phase === 'mission' && mission ? (
            <View style={[styles.pill, { backgroundColor: fg + '1A' }]}>
              <Ionicons name={state.soundOn ? 'volume-high' : 'volume-mute'} size={16} color={fg} />
              <RNText style={{ color: fg, fontSize: 14, fontVariant: ['tabular-nums'] }}>
                {state.soundOn ? t('ring.missionOf', { n: state.missionIndex + 1, total: alarm.missions.length }) : t('ring.soundReturns', { count: state.silenceLeft })}
              </RNText>
            </View>
          ) : null}
        </View>

        {/* Middle */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: spacing.md }}>
          {state.phase === 'done' ? (
            <View style={{ alignItems: 'center', gap: 8 }}>
              <Ionicons name="sunny-outline" size={56} color={fg} />
              <RNText style={{ color: fg, fontSize: 32, fontWeight: '600' }}>{t('ring.allDone')}</RNText>
              <Text style={{ color: fg, opacity: 0.7 }}>{t('ring.allDoneHint')}</Text>
            </View>
          ) : state.phase === 'mission' && mission ? (
            <MissionRun key={mission.id} mission={mission} onActivity={activity} onComplete={completeMission} soundOn={state.soundOn} fg={fg} />
          ) : alarm.missions.length > 0 ? (
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              {alarm.missions.map((m) => (
                <View key={m.id} style={[styles.missionIcon, { backgroundColor: fg + '1A' }]}>
                  <Ionicons name={missionMeta(m.type).icon} size={26} color={fg} />
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {/* Bottom action */}
        {state.phase !== 'done' ? (
          <View style={{ alignItems: 'center', justifyContent: 'flex-end', gap: spacing.sm, minHeight: 100 }}>
            {alarm.missions.length === 0 ? (
              <BigButton label={t('ring.dismiss')} fg={fg} onPress={startMission} />
            ) : state.phase === 'ringing' ? (
              <BigButton label={t('ring.doMission')} fg={fg} onPress={startMission} />
            ) : state.soundOn ? (
              <BigButton
                label={t('ring.silenceFor', { count: alarm.missionWindowSec })}
                fg={fg}
                onPress={startMission}
                disabled={state.mutesLeft !== null && state.mutesLeft <= 0}
              />
            ) : null}
            {alarm.missions.length > 0 && state.mutesLeft !== null ? (
              <Text variant="caption" style={{ color: fg, opacity: 0.6 }}>
                {state.mutesLeft > 0 ? t('ring.muteLeft', { count: state.mutesLeft }) : t('ring.muteExhausted')}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function BigButton({ label, fg, onPress, disabled }: { label: string; fg: string; onPress: () => void; disabled?: boolean }) {
  const bg = fg === '#FFFFFF' ? '#FFFFFF' : '#111113';
  const color = fg === '#FFFFFF' ? '#111113' : '#FFFFFF';
  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.big, { backgroundColor: bg, opacity: disabled ? 0.35 : pressed ? 0.8 : 1 }]}>
      <RNText style={{ color, fontSize: 18, fontWeight: '600' }}>{label}</RNText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  clock: { fontWeight: '200', letterSpacing: -3, fontVariant: ['tabular-nums'] },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full, marginTop: spacing.sm },
  missionIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  big: { width: '100%', maxWidth: 360, paddingVertical: 20, borderRadius: radius.full, alignItems: 'center' },
});
