import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Header, IconButton, Screen, Switch, Text } from '@/components/ui';
import { missionMeta } from '@/missions/registry';
import { useStore } from '@/store';
import { defaultAlarm, type Alarm } from '@/store/types';
import { useDraft } from '@/store/draft';
import { radius, spacing, useTheme } from '@/theme';
import { daysLabel, formatClock, untilLabel } from '@/utils/format';
import { uid } from '@/utils/id';
import { nextFireDate } from '@/utils/time';

function AlarmRow({ alarm }: { alarm: Alarm }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const toggle = useStore((s) => s.toggleAlarm);
  const setDraft = useDraft((s) => s.setDraft);
  const use24h = useStore((s) => s.settings.use24h);
  const { time, suffix } = formatClock(alarm.hour, alarm.minute, use24h);

  return (
    <Pressable
      onPress={() => {
        setDraft(alarm);
        router.push({ pathname: '/alarm/[id]', params: { id: alarm.id } });
      }}
      style={({ pressed }) => [styles.card, { backgroundColor: t.surface, opacity: pressed ? 0.7 : 1 }]}
    >
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
          <Text variant="time" style={{ fontSize: 44, lineHeight: 50, opacity: alarm.enabled ? 1 : 0.35 }}>
            {time}
          </Text>
          {suffix ? <Text variant="muted" style={{ marginBottom: 8 }}>{suffix}</Text> : null}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
          <Text variant="caption" style={{ color: alarm.enabled ? t.text : t.muted }}>
            {[alarm.label, daysLabel(alarm.days, tr)].filter(Boolean).join(' · ')}
          </Text>
          {alarm.missions.length > 0 ? (
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {alarm.missions.map((m) => (
                <Ionicons key={m.id} name={missionMeta(m.type).icon} size={14} color={t.muted} />
              ))}
            </View>
          ) : null}
          {alarm.blocking.enabled ? <Ionicons name="lock-closed-outline" size={14} color={t.muted} /> : null}
        </View>
      </View>
      <Switch value={alarm.enabled} onValueChange={(v) => toggle(alarm.id, v)} />
    </Pressable>
  );
}

export default function AlarmsScreen() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const alarms = useStore((s) => s.alarms);
  const setDraft = useDraft((s) => s.setDraft);
  const [, setTick] = useState(0);

  // Refresh the "rings in" label every 30 s.
  useEffect(() => {
    const id = setInterval(() => setTick((x) => x + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const next = alarms
    .map((a) => ({ a, d: nextFireDate(a) }))
    .filter((x): x is { a: Alarm; d: Date } => !!x.d)
    .sort((x, y) => x.d.getTime() - y.d.getTime())[0];

  const create = () => {
    const a = defaultAlarm(uid());
    setDraft(a);
    router.push({ pathname: '/alarm/[id]', params: { id: a.id, isNew: '1' } });
  };

  return (
    <Screen padded={false}>
      <Header
        large
        title={tr('alarms.title')}
        right={<IconButton name="settings-outline" onPress={() => router.push('/settings')} />}
      />
      <Text variant="muted" style={{ paddingHorizontal: spacing.md, marginTop: -4, marginBottom: spacing.sm }}>
        {next ? tr('alarms.nextAlarmIn', { time: untilLabel(next.a, tr) }) : tr('alarms.noActive')}
      </Text>
      <FlatList
        data={alarms}
        keyExtractor={(a) => a.id}
        renderItem={({ item }) => <AlarmRow alarm={item} />}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.sm, paddingBottom: 120 }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 120, gap: 6 }}>
            <Ionicons name="alarm-outline" size={48} color={t.border} />
            <Text variant="heading" style={{ marginTop: spacing.md }}>{tr('alarms.empty')}</Text>
            <Text variant="muted">{tr('alarms.emptyHint')}</Text>
          </View>
        }
      />
      <Pressable
        onPress={create}
        style={({ pressed }) => [styles.fab, { backgroundColor: t.accent, bottom: insets.bottom + spacing.lg, opacity: pressed ? 0.8 : 1 }]}
      >
        <Ionicons name="add" size={32} color={t.accentText} />
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: radius.lg },
  fab: { position: 'absolute', right: spacing.lg, width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', elevation: 4 },
});
