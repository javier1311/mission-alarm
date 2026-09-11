import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Platform, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AlarmNative } from '@modules/alarm-native';
import { AppBlocker } from '@modules/app-blocker';
import { ensureNotificationPermission } from '@/alarm/scheduler';
import { Card, Header, IconButton, Row, Screen, SectionTitle, Text } from '@/components/ui';
import { spacing, useTheme } from '@/theme';

import * as Notifications from 'expo-notifications';

interface Perm {
  key: string;
  granted: boolean;
  request: () => void;
  required: boolean;
}

/**
 * One place to grant everything the alarm needs to be reliable on Android.
 * Re-checks whenever the app comes back to the foreground.
 */
export default function PermissionsScreen() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const [perms, setPerms] = useState<Perm[]>([]);
  const [alarmKit, setAlarmKit] = useState(false);

  const refresh = useCallback(async () => {
    const notif = (await Notifications.getPermissionsAsync().catch(() => ({ granted: false }))).granted;
    const list: Perm[] = [
      { key: 'notifications', granted: notif, request: () => ensureNotificationPermission().then(refresh), required: true },
    ];
    if (Platform.OS === 'ios' && AlarmNative.isSupported()) {
      list.push({ key: 'alarmKit', granted: alarmKit, request: () => AlarmNative.requestAuthorization().then((ok) => setAlarmKit(ok)), required: true });
    }
    if (Platform.OS === 'android' && AlarmNative.isSupported()) {
      list.push({ key: 'exactAlarm', granted: AlarmNative.canScheduleExact(), request: AlarmNative.openExactAlarmSettings, required: true });
    }
    if (AppBlocker.isSupported()) {
      list.push(
        { key: 'overlay', granted: AppBlocker.hasOverlayPermission(), request: AppBlocker.openOverlaySettings, required: true },
        { key: 'usage', granted: AppBlocker.hasUsageAccess(), request: AppBlocker.openUsageAccessSettings, required: false },
        { key: 'battery', granted: AppBlocker.isIgnoringBatteryOptimizations(), request: AppBlocker.openBatterySettings, required: false },
      );
    }
    setPerms(list);
  }, [alarmKit]);

  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    return () => sub.remove();
  }, [refresh]);

  return (
    <Screen padded={false}>
      <Header title={tr('perms.title')} left={<IconButton name="chevron-back" onPress={() => router.back()} />} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Text variant="muted" style={{ paddingHorizontal: spacing.md, paddingTop: spacing.sm }}>{tr('perms.intro')}</Text>
        <SectionTitle>{tr('perms.alarm')}</SectionTitle>
        <Card style={{ marginHorizontal: spacing.md }}>
          {perms.filter((p) => p.required).map((p, i, arr) => (
            <Row
              key={p.key}
              icon={p.granted ? 'checkmark-circle' : 'alert-circle-outline'}
              title={tr(`perms.${p.key}`)}
              subtitle={tr(`perms.${p.key}Hint`)}
              value={p.granted ? tr('perms.granted') : undefined}
              onPress={p.granted ? undefined : p.request}
              last={i === arr.length - 1}
            />
          ))}
        </Card>
        {perms.some((p) => !p.required) ? (
          <>
            <SectionTitle>{tr('perms.blocking')}</SectionTitle>
            <Card style={{ marginHorizontal: spacing.md }}>
              {perms.filter((p) => !p.required).map((p, i, arr) => (
                <Row
                  key={p.key}
                  icon={p.granted ? 'checkmark-circle' : 'alert-circle-outline'}
                  title={tr(`perms.${p.key}`)}
                  subtitle={tr(`perms.${p.key}Hint`)}
                  value={p.granted ? tr('perms.granted') : undefined}
                  onPress={p.granted ? undefined : p.request}
                  last={i === arr.length - 1}
                />
              ))}
            </Card>
          </>
        ) : null}
        {Platform.OS === 'ios' ? (
          <Text variant="caption" style={{ padding: spacing.md, color: t.muted }}>{tr('editor.blockingAndroidOnly')}</Text>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
