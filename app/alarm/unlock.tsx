import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { TimePicker } from '@/components/TimePicker';
import { Button, Card, Chip, Header, IconButton, Row, Screen, SectionTitle, Stepper, Text } from '@/components/ui';
import { missionMeta, missionSummary } from '@/missions/registry';
import { useDraft } from '@/store/draft';
import type { UnlockRule } from '@/store/types';
import { spacing, useTheme } from '@/theme';

const KINDS: UnlockRule['kind'][] = ['none', 'time', 'mission', 'location'];

/** "Keep apps locked after the alarm until…" rule editor. */
export default function UnlockRuleScreen() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const draft = useDraft((s) => s.draft);
  const patch = useDraft((s) => s.patch);
  const removeMission = useDraft((s) => s.removeMission);
  const [locating, setLocating] = useState(false);

  if (!draft) return null;
  const rule = draft.blocking.unlock;
  const setRule = (unlock: UnlockRule) => patch({ blocking: { ...draft.blocking, unlock } });

  const switchKind = (kind: UnlockRule['kind']) => {
    if (kind === rule.kind) return;
    switch (kind) {
      case 'none':
        return setRule({ kind });
      case 'time':
        return setRule({ kind, hour: Math.min(23, draft.hour + 1), minute: draft.minute });
      case 'mission':
        return setRule({ kind, missions: [] });
      case 'location':
        return setRule({ kind, mode: 'leaveHome', lat: 0, lng: 0, radiusM: 150 });
    }
  };

  const useCurrentLocation = async () => {
    if (rule.kind !== 'location') return;
    setLocating(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setRule({ ...rule, lat: loc.coords.latitude, lng: loc.coords.longitude });
    } finally {
      setLocating(false);
    }
  };

  return (
    <Screen padded={false}>
      <Header title={tr('editor.keepLocked')} left={<IconButton name="chevron-back" onPress={() => router.back()} />} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <SectionTitle hint={tr('editor.keepLockedHint')}>{tr('editor.keepLocked')}</SectionTitle>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.md }}>
          {KINDS.map((k) => (
            <Chip key={k} label={tr(`editor.unlock_${k}`)} selected={rule.kind === k} onPress={() => switchKind(k)} />
          ))}
        </View>

        {rule.kind === 'time' ? (
          <>
            <SectionTitle>{tr('editor.unlockTime')}</SectionTitle>
            <TimePicker hour={rule.hour} minute={rule.minute} onChange={(hour, minute) => setRule({ ...rule, hour, minute })} />
          </>
        ) : null}

        {rule.kind === 'mission' ? (
          <>
            <SectionTitle>{tr('editor.unlockMissions')}</SectionTitle>
            <Card style={{ marginHorizontal: spacing.md }}>
              {rule.missions.map((m) => (
                <Row
                  key={m.id}
                  icon={missionMeta(m.type).icon}
                  title={tr(`missions.${missionMeta(m.type).titleKey}`)}
                  subtitle={missionSummary(m, tr) || undefined}
                  onPress={() => router.push({ pathname: '/alarm/mission', params: { missionId: m.id, target: 'unlock' } })}
                  right={<IconButton name="trash-outline" size={20} color={t.muted} onPress={() => removeMission(m.id, 'unlock')} />}
                />
              ))}
              <Row title={tr('editor.addMission')} icon="add-circle-outline" last onPress={() => router.push({ pathname: '/alarm/mission', params: { target: 'unlock' } })} />
            </Card>
          </>
        ) : null}

        {rule.kind === 'location' ? (
          <>
            <SectionTitle>{tr('editor.locationMode')}</SectionTitle>
            <View style={{ flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md }}>
              {(['leaveHome', 'reachWork'] as const).map((mode) => (
                <Chip key={mode} label={tr(`editor.${mode}`)} selected={rule.mode === mode} onPress={() => setRule({ ...rule, mode })} />
              ))}
            </View>
            <Card style={{ marginHorizontal: spacing.md, marginTop: spacing.md }}>
              <Row
                title={tr('editor.radius')}
                right={<Stepper value={rule.radiusM} min={50} max={1000} step={50} onChange={(radiusM) => setRule({ ...rule, radiusM })} format={(v) => `${v} m`} />}
              />
              <View style={{ padding: spacing.md, gap: spacing.sm }}>
                <Button title={tr('editor.setCurrentLocation')} kind="secondary" icon="locate-outline" onPress={useCurrentLocation} disabled={locating} />
                {rule.lat !== 0 ? (
                  <Text variant="caption" style={{ textAlign: 'center' }}>
                    {tr('editor.locationSet')} · {rule.lat.toFixed(4)}, {rule.lng.toFixed(4)}
                  </Text>
                ) : null}
              </View>
            </Card>
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
