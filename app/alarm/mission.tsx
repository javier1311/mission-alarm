import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, Card, Chip, Header, IconButton, Row, Screen, SectionTitle, Stepper, Switch, Text } from '@/components/ui';
import { MISSIONS, missionMeta, missionReady } from '@/missions/registry';
import { useDraft } from '@/store/draft';
import type { BarcodeMission, Mission } from '@/store/types';
import { radius, spacing, useTheme } from '@/theme';

/**
 * Add / edit a mission on the draft alarm.
 * Query params: missionId (edit existing) · target = 'missions' | 'unlock' (which list).
 */
export default function MissionConfig() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const { missionId, target: targetParam } = useLocalSearchParams<{ missionId?: string; target?: string }>();
  const target = targetParam === 'unlock' ? 'unlock' : 'missions';
  const draft = useDraft((s) => s.draft);
  const upsertMission = useDraft((s) => s.upsertMission);

  const list = target === 'missions' ? draft?.missions ?? [] : draft?.blocking.unlock.kind === 'mission' ? draft.blocking.unlock.missions : [];
  const existing = list.find((m) => m.id === missionId);
  const [mission, setMission] = useState<Mission | null>(existing ?? null);

  const save = () => {
    if (!mission || !missionReady(mission)) return;
    upsertMission(mission, target);
    router.back();
  };

  if (!mission) {
    return (
      <Screen padded={false}>
        <Header title={tr('editor.addMission')} left={<IconButton name="close" onPress={() => router.back()} />} />
        <Card style={{ margin: spacing.md }}>
          {MISSIONS.map((m, i) => (
            <Row key={m.type} icon={m.icon} title={tr(`missions.${m.titleKey}`)} subtitle={tr(`missions.${m.descKey}`)} last={i === MISSIONS.length - 1} onPress={() => setMission(m.create())} />
          ))}
        </Card>
      </Screen>
    );
  }

  const meta = missionMeta(mission.type);

  return (
    <Screen padded={false}>
      <Header
        title={tr(`missions.${meta.titleKey}`)}
        left={<IconButton name="close" onPress={() => router.back()} />}
        right={<IconButton name="checkmark" onPress={save} color={missionReady(mission) ? t.text : t.border} />}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {mission.type === 'barcode' ? <BarcodeConfig mission={mission} onChange={setMission} /> : null}

        {mission.type === 'fitness' ? (
          <>
            <SectionTitle>{tr('missions.exercise')}</SectionTitle>
            <View style={{ flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md }}>
              {(['pushup', 'squat'] as const).map((e) => (
                <Chip key={e} label={tr(`missions.${e}`)} selected={mission.exercise === e} onPress={() => setMission({ ...mission, exercise: e })} />
              ))}
            </View>
            <SectionTitle>{tr('missions.reps')}</SectionTitle>
            <Card style={{ marginHorizontal: spacing.md }}>
              <Row title={tr('missions.reps')} last right={<Stepper value={mission.reps} min={1} max={100} onChange={(reps) => setMission({ ...mission, reps })} />} />
            </Card>
          </>
        ) : null}

        {mission.type === 'photo' ? (
          <>
            <SectionTitle hint={tr('missions.requireOutdoorsHint')}>{tr('missions.photo')}</SectionTitle>
            <Card style={{ marginHorizontal: spacing.md }}>
              <Row title={tr('missions.requireOutdoors')} icon="navigate-outline" last right={<Switch value={mission.requireOutdoors} onValueChange={(requireOutdoors) => setMission({ ...mission, requireOutdoors })} />} />
            </Card>
          </>
        ) : null}

        {mission.type === 'math' ? (
          <>
            <SectionTitle>{tr('missions.difficulty')}</SectionTitle>
            <View style={{ flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md }}>
              {(['easy', 'medium', 'hard'] as const).map((d) => (
                <Chip key={d} label={tr(`missions.${d}`)} selected={mission.difficulty === d} onPress={() => setMission({ ...mission, difficulty: d })} />
              ))}
            </View>
            <SectionTitle>{tr('missions.count')}</SectionTitle>
            <Card style={{ marginHorizontal: spacing.md }}>
              <Row title={tr('missions.count')} last right={<Stepper value={mission.count} min={1} max={20} onChange={(count) => setMission({ ...mission, count })} />} />
            </Card>
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function BarcodeConfig({ mission, onChange }: { mission: BarcodeMission; onChange: (m: BarcodeMission) => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const [perm, request] = useCameraPermissions();
  const [scanning, setScanning] = useState(!mission.code);

  const startScan = () => {
    if (!perm?.granted) request().then((p) => p.granted && setScanning(true));
    else setScanning(true);
  };

  return (
    <>
      <SectionTitle>{tr('missions.barcode')}</SectionTitle>
      <View style={{ alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.md }}>
        {scanning && perm?.granted ? (
          <View style={[styles.frame, { borderColor: t.border }]}>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              onBarcodeScanned={({ data, type }) => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                onChange({ ...mission, code: data, format: type });
                setScanning(false);
              }}
            />
          </View>
        ) : null}
        {mission.code ? (
          <Card style={{ width: '100%' }}>
            <Row icon="checkmark-circle" title={tr('missions.scanned')} subtitle={mission.code} chevron={false} last />
          </Card>
        ) : null}
        {scanning && perm?.granted && !mission.code ? <Text variant="muted" style={{ textAlign: 'center' }}>{tr('missions.scanCode')}</Text> : null}
        {!scanning || !perm?.granted ? <Button title={mission.code ? tr('missions.rescan') : tr('missions.scanCode')} kind="secondary" icon="scan-outline" onPress={startScan} /> : null}
      </View>
      <SectionTitle>{tr('missions.codeLabel')}</SectionTitle>
      <Card style={{ marginHorizontal: spacing.md }}>
        <TextInput
          value={mission.label}
          onChangeText={(label) => onChange({ ...mission, label })}
          placeholder={tr('missions.codeLabelPlaceholder')}
          placeholderTextColor={t.muted}
          style={{ color: t.text, fontSize: 16, paddingHorizontal: spacing.md, paddingVertical: 14 }}
        />
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  frame: { width: 260, height: 260, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1 },
});
