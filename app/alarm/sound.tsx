import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { alarmPlayer } from '@/audio/alarmPlayer';
import { Card, Header, IconButton, Row, Screen, SectionTitle } from '@/components/ui';
import { SOUNDS } from '@/data/sounds';
import { useStore } from '@/store';
import { useDraft } from '@/store/draft';
import { spacing, useTheme } from '@/theme';
import { uid } from '@/utils/id';

export default function SoundPicker() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const draft = useDraft((s) => s.draft);
  const patch = useDraft((s) => s.patch);
  const customSounds = useStore((s) => s.customSounds);
  const addCustomSound = useStore((s) => s.addCustomSound);
  const removeCustomSound = useStore((s) => s.removeCustomSound);
  const [playing, setPlaying] = useState<string | null>(null);

  useEffect(() => () => void alarmPlayer.stop(), []);

  const choose = (id: string) => {
    patch({ soundId: id });
    if (playing === id) {
      alarmPlayer.stop();
      setPlaying(null);
    } else {
      setPlaying(id);
      alarmPlayer.preview(id);
    }
  };

  const importFile = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: true });
    if (res.canceled || !res.assets[0]) return;
    const asset = res.assets[0];
    const id = `custom:${uid()}`;
    let uri = asset.uri;
    if (Platform.OS !== 'web') {
      const dir = new Directory(Paths.document, 'sounds');
      if (!dir.exists) dir.create();
      const ext = asset.name?.split('.').pop() || 'mp3';
      const dest = new File(dir, `${id.replace(':', '_')}.${ext}`);
      await new File(asset.uri).copy(dest);
      uri = dest.uri;
    }
    addCustomSound({ id, name: asset.name ?? 'Custom', uri });
    patch({ soundId: id });
  };

  const remove = (id: string) => {
    const s = customSounds.find((x) => x.id === id);
    if (s && Platform.OS !== 'web') {
      try {
        new File(s.uri).delete();
      } catch {}
    }
    removeCustomSound(id);
    if (draft?.soundId === id) patch({ soundId: SOUNDS[0].id });
  };

  const item = (id: string, name: string, last: boolean, onRemove?: () => void) => (
    <Row
      key={id}
      title={name}
      icon={playing === id ? 'pause-circle-outline' : 'play-circle-outline'}
      onPress={() => choose(id)}
      chevron={false}
      last={last}
      right={
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {onRemove ? <IconButton name="trash-outline" size={18} color={t.muted} onPress={onRemove} /> : null}
          <IconButton name={draft?.soundId === id ? 'checkmark-circle' : 'ellipse-outline'} color={draft?.soundId === id ? t.text : t.border} onPress={() => choose(id)} />
        </View>
      }
    />
  );

  const trend = SOUNDS.filter((s) => s.category === 'trend');
  const classic = SOUNDS.filter((s) => s.category === 'classic');

  return (
    <Screen padded={false}>
      <Header title={tr('sounds.title')} left={<IconButton name="chevron-back" onPress={() => router.back()} />} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <SectionTitle>{tr('sounds.custom')}</SectionTitle>
        <Card style={{ marginHorizontal: spacing.md }}>
          {customSounds.map((s, i) => item(s.id, s.name, false, () => remove(s.id)))}
          <Row title={tr('sounds.addFromFiles')} icon="folder-open-outline" last onPress={importFile} />
        </Card>
        <SectionTitle>{tr('sounds.trend')}</SectionTitle>
        <Card style={{ marginHorizontal: spacing.md }}>{trend.map((s, i) => item(s.id, tr(`sounds.${s.nameKey}`), i === trend.length - 1))}</Card>
        <SectionTitle>{tr('sounds.classic')}</SectionTitle>
        <Card style={{ marginHorizontal: spacing.md }}>{classic.map((s, i) => item(s.id, tr(`sounds.${s.nameKey}`), i === classic.length - 1))}</Card>
      </ScrollView>
    </Screen>
  );
}
