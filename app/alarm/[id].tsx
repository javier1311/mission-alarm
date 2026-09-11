import Slider from '@react-native-community/slider';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Platform, ScrollView, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { blockingAvailable, blockingPermissionsGranted } from '@/alarm/lock';
import { TimePicker } from '@/components/TimePicker';
import { Button, Card, Chip, Header, IconButton, Row, Screen, SectionTitle, Stepper, Switch, Text } from '@/components/ui';
import { soundById } from '@/data/sounds';
import { missionMeta, missionReady, missionSummary } from '@/missions/registry';
import { useStore } from '@/store';
import { useDraft } from '@/store/draft';
import type { Weekday } from '@/store/types';
import { spacing, useTheme } from '@/theme';

const DAY_ORDER: Weekday[] = [1, 2, 3, 4, 5, 6, 0];

export default function AlarmEditor() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const { isNew } = useLocalSearchParams<{ id: string; isNew?: string }>();
  const draft = useDraft((s) => s.draft);
  const patch = useDraft((s) => s.patch);
  const removeMission = useDraft((s) => s.removeMission);
  const upsertAlarm = useStore((s) => s.upsertAlarm);
  const removeAlarm = useStore((s) => s.removeAlarm);
  const customSounds = useStore((s) => s.customSounds);

  if (!draft) return null;

  const dayNames = tr('days.short', { returnObjects: true }) as string[];
  const soundName = draft.soundId.startsWith('custom:')
    ? customSounds.find((s) => s.id === draft.soundId)?.name ?? tr('editor.custom')
    : tr(`sounds.${soundById(draft.soundId)?.nameKey ?? 'classicAlarm'}`);
  const wallpaperName = draft.wallpaperId.startsWith('custom:') ? tr('editor.custom') : draft.wallpaperId.replace('_', ' ');
  const canSave = draft.missions.every(missionReady);

  const save = () => {
    upsertAlarm({ ...draft, enabled: true });
    router.back();
  };

  const confirmDelete = () => {
    const doDelete = () => {
      removeAlarm(draft.id);
      router.back();
    };
    if (Platform.OS === 'web') return doDelete();
    Alert.alert(tr('editor.deleteConfirm'), undefined, [
      { text: tr('common.cancel'), style: 'cancel' },
      { text: tr('common.delete'), style: 'destructive', onPress: doDelete },
    ]);
  };

  const unlockLabel = tr(`editor.unlock_${draft.blocking.unlock.kind}`);

  return (
    <Screen padded={false}>
      <Header
        title={isNew ? tr('editor.newAlarm') : tr('editor.editAlarm')}
        left={<IconButton name="close" onPress={() => router.back()} />}
        right={<IconButton name="checkmark" onPress={save} color={canSave ? t.text : t.border} />}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <TimePicker hour={draft.hour} minute={draft.minute} onChange={(hour, minute) => patch({ hour, minute })} />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.md, gap: 6 }}>
          {DAY_ORDER.map((d) => (
            <Chip
              key={d}
              label={dayNames[d]}
              selected={draft.days.includes(d)}
              style={{ flex: 1, alignItems: 'center', paddingHorizontal: 4 }}
              onPress={() =>
                patch({ days: draft.days.includes(d) ? draft.days.filter((x) => x !== d) : [...draft.days, d] })
              }
            />
          ))}
        </View>

        <SectionTitle>{tr('editor.label')}</SectionTitle>
        <Card style={{ marginHorizontal: spacing.md }}>
          <TextInput
            value={draft.label}
            onChangeText={(label) => patch({ label })}
            placeholder={tr('editor.labelPlaceholder')}
            placeholderTextColor={t.muted}
            style={{ color: t.text, fontSize: 16, paddingHorizontal: spacing.md, paddingVertical: 14 }}
          />
        </Card>

        <SectionTitle>{tr('editor.sound')}</SectionTitle>
        <Card style={{ marginHorizontal: spacing.md }}>
          <Row title={tr('editor.sound')} value={soundName} icon="musical-notes-outline" onPress={() => router.push('/alarm/sound')} />
          <Row title={tr('editor.wallpaper')} value={wallpaperName} icon="image-outline" onPress={() => router.push('/alarm/wallpaper')} />
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: 8, gap: spacing.sm }}>
            <Text style={{ flex: 1 }}>{tr('editor.volume')}</Text>
            <Slider
              style={{ width: 160, height: 32 }}
              minimumValue={0.1}
              maximumValue={1}
              value={draft.volume}
              onSlidingComplete={(volume) => patch({ volume })}
              minimumTrackTintColor={t.text}
              maximumTrackTintColor={t.border}
              thumbTintColor={t.text}
            />
          </View>
          <Row title={tr('editor.vibrate')} last right={<Switch value={draft.vibrate} onValueChange={(vibrate) => patch({ vibrate })} />} />
        </Card>

        <SectionTitle hint={tr('editor.missionsHint')}>{tr('editor.missions')}</SectionTitle>
        <Card style={{ marginHorizontal: spacing.md }}>
          {draft.missions.map((m) => (
            <Row
              key={m.id}
              icon={missionMeta(m.type).icon}
              title={tr(`missions.${missionMeta(m.type).titleKey}`)}
              subtitle={missionSummary(m, tr) || undefined}
              onPress={() => router.push({ pathname: '/alarm/mission', params: { missionId: m.id } })}
              right={<IconButton name="trash-outline" size={20} color={t.muted} onPress={() => removeMission(m.id)} />}
            />
          ))}
          <Row title={tr('editor.addMission')} icon="add-circle-outline" last onPress={() => router.push('/alarm/mission')} />
        </Card>

        <SectionTitle>{tr('editor.muteLimit')}</SectionTitle>
        <Card style={{ marginHorizontal: spacing.md }}>
          <Row
            title={tr('editor.muteLimit')}
            subtitle={tr('editor.muteLimitHint')}
            right={
              <Stepper
                value={draft.muteLimit ?? 11}
                min={1}
                max={11}
                onChange={(v) => patch({ muteLimit: v >= 11 ? null : v })}
                format={(v) => (v >= 11 ? '∞' : String(v))}
              />
            }
          />
          <Row
            title={tr('editor.missionWindow')}
            subtitle={tr('editor.missionWindowHint')}
            last
            right={<Stepper value={draft.missionWindowSec} min={5} max={60} step={5} onChange={(missionWindowSec) => patch({ missionWindowSec })} format={(v) => `${v}s`} />}
          />
        </Card>

        <SectionTitle hint={Platform.OS === 'ios' ? tr('editor.blockingAndroidOnly') : tr('editor.blockingHint')}>{tr('editor.blocking')}</SectionTitle>
        <Card style={{ marginHorizontal: spacing.md }}>
          <Row
            title={tr('editor.blocking')}
            icon="lock-closed-outline"
            last={!draft.blocking.enabled}
            right={
              <Switch
                value={draft.blocking.enabled}
                onValueChange={(enabled) => {
                  patch({ blocking: { ...draft.blocking, enabled } });
                  if (enabled && blockingAvailable() && !blockingPermissionsGranted()) router.push('/permissions');
                }}
              />
            }
          />
          {draft.blocking.enabled ? (
            <Row title={tr('editor.keepLocked')} subtitle={unlockLabel} icon="time-outline" last onPress={() => router.push('/alarm/unlock')} />
          ) : null}
        </Card>

        <View style={{ padding: spacing.md, marginTop: spacing.lg, gap: spacing.sm }}>
          <Button
            title={tr('alarms.test')}
            kind="secondary"
            icon="play-outline"
            disabled={!canSave}
            onPress={() => {
              upsertAlarm(draft);
              useStore.getState().setActiveAlarm(draft.id);
              router.push({ pathname: '/ring/[id]', params: { id: draft.id } });
            }}
          />
          {!isNew ? (
            <Button title={tr('editor.deleteAlarm')} kind="ghost" icon="trash-outline" onPress={confirmDelete} style={{ borderWidth: 1, borderColor: t.border }} />
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}
