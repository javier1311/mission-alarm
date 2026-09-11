import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { AlarmNative } from '@modules/alarm-native';
import i18n from '@/i18n';
import type { Alarm } from '@/store/types';
import { nextFireDate } from '@/utils/time';

/**
 * Scheduling strategy:
 *  - Android (native build): AlarmManager via alarm-native — exact, wakes the
 *    device, launches the app over the lock screen, survives reboot.
 *  - Otherwise (iOS until AlarmKit, Expo Go, web): local notifications that
 *    bring the user back into the app, plus the in-app ticker (useAlarmTicker).
 */

export const CHANNEL_ID = 'alarms';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    // While the app is open the ticker rings the alarm itself; keep the banner quiet.
    shouldShowBanner: false,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Alarms',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
      vibrationPattern: [0, 500, 800, 500],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const req = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false, allowCriticalAlerts: true },
  });
  return req.granted;
}

export async function rescheduleAll(alarms: Alarm[]) {
  if (Platform.OS === 'web') return;
  if (AlarmNative.isSupported()) {
    scheduleNative(alarms);
    return;
  }
  await scheduleNotifications(alarms);
}

function scheduleNative(alarms: Alarm[]) {
  try {
    AlarmNative.cancelAll();
    for (const alarm of alarms) {
      const next = nextFireDate(alarm);
      if (!next) continue;
      AlarmNative.schedule(alarm.id, next.getTime(), alarm.label);
    }
  } catch (e) {
    console.warn('native schedule failed', e);
  }
}

async function scheduleNotifications(alarms: Alarm[]) {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    for (const alarm of alarms) {
      if (!alarm.enabled) continue;
      const content = {
        title: alarm.label || i18n.t('notif.title'),
        body: i18n.t('notif.body'),
        sound: 'default',
        data: { alarmId: alarm.id },
        priority: Notifications.AndroidNotificationPriority.MAX,
        ...(Platform.OS === 'ios' ? { interruptionLevel: 'timeSensitive' as const } : {}),
      };
      if (alarm.days.length === 0) {
        const date = nextFireDate(alarm);
        if (!date) continue;
        await Notifications.scheduleNotificationAsync({
          identifier: `${alarm.id}:once`,
          content,
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: CHANNEL_ID },
        });
      } else {
        for (const day of alarm.days) {
          await Notifications.scheduleNotificationAsync({
            identifier: `${alarm.id}:${day}`,
            content,
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
              weekday: day + 1, // expo: 1 = Sunday
              hour: alarm.hour,
              minute: alarm.minute,
              channelId: CHANNEL_ID,
            },
          });
        }
      }
    }
  } catch (e) {
    console.warn('rescheduleAll failed', e);
  }
}
