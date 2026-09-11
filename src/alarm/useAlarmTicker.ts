import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { useStore } from '@/store';
import type { Weekday } from '@/store/types';

import { rescheduleAll } from './scheduler';

const minuteKey = (d: Date) =>
  `${d.getFullYear()}-${d.getMonth()}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}`;

/**
 * Fires alarms while the app is running (foreground) and reacts to the user
 * tapping an alarm notification. Also keeps scheduled notifications in sync
 * with the alarm list.
 */
export function useAlarmTicker() {
  const router = useRouter();
  const fired = useRef<Record<string, string>>({});

  const openRing = (alarmId: string) => {
    useStore.getState().setActiveAlarm(alarmId);
    router.push({ pathname: '/ring/[id]', params: { id: alarmId } });
  };

  // Keep OS notifications in sync with alarm list changes.
  useEffect(() => {
    let last = '';
    const sync = () => {
      const { alarms, hydrated } = useStore.getState();
      if (!hydrated) return;
      const sig = JSON.stringify(alarms.map((a) => [a.id, a.enabled, a.hour, a.minute, a.days, a.label]));
      if (sig === last) return;
      last = sig;
      rescheduleAll(alarms);
    };
    sync();
    return useStore.subscribe(sync);
  }, []);

  // Foreground ticker.
  useEffect(() => {
    const tick = () => {
      const { alarms, activeAlarmId, hydrated, toggleAlarm } = useStore.getState();
      if (!hydrated || activeAlarmId) return;
      const now = new Date();
      const key = minuteKey(now);
      for (const a of alarms) {
        if (!a.enabled || a.hour !== now.getHours() || a.minute !== now.getMinutes()) continue;
        if (a.days.length && !a.days.includes(now.getDay() as Weekday)) continue;
        if (fired.current[a.id] === key) continue;
        fired.current[a.id] = key;
        if (a.days.length === 0) toggleAlarm(a.id, false);
        openRing(a.id);
        return;
      }
    };
    const id = setInterval(tick, 1000);
    const sub = AppState.addEventListener('change', (s) => s === 'active' && tick());
    return () => {
      clearInterval(id);
      sub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resume a ring that was active when the app was killed / reopened.
  useEffect(() => {
    const unsub = useStore.subscribe((s, prev) => {
      if (s.hydrated && !prev.hydrated && s.activeAlarmId) {
        router.push({ pathname: '/ring/[id]', params: { id: s.activeAlarmId } });
      }
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Notification tap → ring screen.
  useEffect(() => {
    const handle = (response: Notifications.NotificationResponse | null) => {
      const alarmId = response?.notification.request.content.data?.alarmId as string | undefined;
      if (!alarmId) return;
      const { alarms, toggleAlarm } = useStore.getState();
      const alarm = alarms.find((a) => a.id === alarmId);
      if (!alarm) return;
      if (alarm.days.length === 0) toggleAlarm(alarm.id, false);
      openRing(alarmId);
    };
    Notifications.getLastNotificationResponseAsync?.().then(handle).catch(() => {});
    const sub = Notifications.addNotificationResponseReceivedListener(handle);
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
