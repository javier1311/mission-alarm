import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ensureNotificationPermission } from '@/alarm/scheduler';
import { Card, Chip, Header, IconButton, Row, Screen, SectionTitle, Switch } from '@/components/ui';
import { LANGUAGES } from '@/i18n';
import { useStore } from '@/store';
import { spacing } from '@/theme';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);

  return (
    <Screen padded={false}>
      <Header title={t('settings.title')} left={<IconButton name="chevron-back" onPress={() => router.back()} />} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <SectionTitle>{t('settings.theme')}</SectionTitle>
        <View style={{ flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md }}>
          {(['system', 'light', 'dark'] as const).map((m) => (
            <Chip key={m} label={t(`settings.${m}`)} selected={settings.themeMode === m} onPress={() => setSettings({ themeMode: m })} />
          ))}
        </View>

        <SectionTitle>{t('settings.language')}</SectionTitle>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.md }}>
          <Chip label={t('settings.deviceLanguage')} selected={settings.language === null} onPress={() => setSettings({ language: null })} />
          {LANGUAGES.map((l) => (
            <Chip key={l.code} label={l.name} selected={settings.language === l.code} onPress={() => setSettings({ language: l.code })} />
          ))}
        </View>

        <SectionTitle>{t('settings.appearance')}</SectionTitle>
        <Card style={{ marginHorizontal: spacing.md }}>
          <Row title={t('settings.timeFormat')} last right={<Switch value={settings.use24h} onValueChange={(use24h) => setSettings({ use24h })} />} />
        </Card>

        <SectionTitle hint={t('settings.notificationsHint')}>{t('settings.notifications')}</SectionTitle>
        <Card style={{ marginHorizontal: spacing.md }}>
          <Row title={t('settings.grant')} icon="notifications-outline" last onPress={() => ensureNotificationPermission()} />
        </Card>

        <SectionTitle>{t('settings.about')}</SectionTitle>
        <Card style={{ marginHorizontal: spacing.md }}>
          <Row title={t('settings.version')} value={Constants.expoConfig?.version ?? '-'} />
          <Row title={t('settings.credits')} last />
        </Card>
      </ScrollView>
    </Screen>
  );
}
