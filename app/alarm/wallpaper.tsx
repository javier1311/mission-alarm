import { Ionicons } from '@expo/vector-icons';
import { Directory, File, Paths } from 'expo-file-system';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Header, IconButton, Screen, SectionTitle, Text } from '@/components/ui';
import { WALLPAPERS } from '@/data/wallpapers';
import { useStore } from '@/store';
import { useDraft } from '@/store/draft';
import { radius, spacing, useTheme } from '@/theme';
import { uid } from '@/utils/id';

export default function WallpaperPicker() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const draft = useDraft((s) => s.draft);
  const patch = useDraft((s) => s.patch);
  const custom = useStore((s) => s.customWallpapers);
  const addCustomWallpaper = useStore((s) => s.addCustomWallpaper);
  const removeCustomWallpaper = useStore((s) => s.removeCustomWallpaper);
  // Explicit tile size: percentage width + aspectRatio collapses to 0 height on native inside a wrapping row.
  const { width } = useWindowDimensions();
  const tileW = Math.floor((Math.min(width, 600) - spacing.md * 2 - spacing.sm * 2) / 3);
  const tileStyle = { width: tileW, height: Math.round((tileW * 16) / 9) };

  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: false });
    if (res.canceled || !res.assets[0]) return;
    const id = `custom:${uid()}`;
    let uri = res.assets[0].uri;
    if (Platform.OS !== 'web') {
      const dir = new Directory(Paths.document, 'wallpapers');
      if (!dir.exists) dir.create();
      const dest = new File(dir, `${id.replace(':', '_')}.jpg`);
      await new File(uri).copy(dest);
      uri = dest.uri;
    }
    addCustomWallpaper({ id, uri });
    patch({ wallpaperId: id });
  };

  const remove = (id: string) => {
    const w = custom.find((x) => x.id === id);
    if (w && Platform.OS !== 'web') {
      try {
        new File(w.uri).delete();
      } catch {}
    }
    removeCustomWallpaper(id);
    if (draft?.wallpaperId === id) patch({ wallpaperId: WALLPAPERS[0].id });
  };

  const tile = (id: string, source: number | { uri: string }, onRemove?: () => void) => {
    const selected = draft?.wallpaperId === id;
    return (
      <Pressable key={id} onPress={() => patch({ wallpaperId: id })} style={({ pressed }) => [styles.tile, tileStyle, { opacity: pressed ? 0.7 : 1, borderColor: selected ? t.text : 'transparent' }]}>
        <Image source={source} style={StyleSheet.absoluteFill} contentFit="cover" />
        {selected ? (
          <View style={styles.check}>
            <Ionicons name="checkmark" size={16} color="#111" />
          </View>
        ) : null}
        {onRemove ? (
          <Pressable onPress={onRemove} hitSlop={8} style={styles.remove}>
            <Ionicons name="close" size={14} color="#fff" />
          </Pressable>
        ) : null}
      </Pressable>
    );
  };

  return (
    <Screen padded={false}>
      <Header title={tr('wallpapers.title')} left={<IconButton name="chevron-back" onPress={() => router.back()} />} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <SectionTitle>{tr('wallpapers.custom')}</SectionTitle>
        <View style={styles.grid}>
          {custom.map((w) => tile(w.id, { uri: w.uri }, () => remove(w.id)))}
          <Pressable onPress={pick} style={({ pressed }) => [styles.tile, tileStyle, { backgroundColor: t.surface, borderColor: 'transparent', opacity: pressed ? 0.7 : 1, alignItems: 'center', justifyContent: 'center' }]}>
            <Ionicons name="add" size={28} color={t.muted} />
            <Text variant="caption" style={{ textAlign: 'center', paddingHorizontal: 6 }}>{tr('wallpapers.addFromGallery')}</Text>
          </Pressable>
        </View>
        <SectionTitle>{tr('wallpapers.builtIn')}</SectionTitle>
        <View style={styles.grid}>{WALLPAPERS.map((w) => tile(w.id, w.thumb))}</View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.md },
  tile: { borderRadius: radius.md, overflow: 'hidden', borderWidth: 2 },
  check: { position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  remove: { position: 'absolute', top: 8, left: 8, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
});
