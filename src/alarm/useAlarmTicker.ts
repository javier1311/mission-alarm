import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { AlarmNative } from '@modules/alarm-native';
import { AppBlocker } from '@modules/app-blocker';
import { useStore } from '@/store';
import type { Weekday } from '@/store/types';

import { resumeLockIfNeeded } from './lock';
import { rescheduleAll } from './scheduler';

const minuteKey = (d: Date) =>
  `${d.getFullYear()}-${d.getMonth()}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}`;

/**
 * Glue between the OS and the ring / lock screens:
 *  - keeps native alarms (or notifications) in sync with the alarm list
 *  - opens the ring screen when the app is launched by a fired alarm
 *  - fires alarms itself while the app is in the foreground (non-native builds)
 *  - reopens the lock screen when the app blocker brings the app to front
 */
export function useAlarmTicker() {
  const router = useRouter();
  const fired = useRef<Record<string, string>>({});

  const openRing = (alarmId: string) => {
    const { alarms, toggleAlarm, setActiveAlarm } = useStore.getState();
    const alarm = alarms.find((a) => a.id === alarmId);
    if (!alarm) return;
    if (alarm.days.length === 0) toggleAlarm(alarm.id, false);
    setActiveAlarm(alarmId);
    router.push({ pathname: '/ring/[id]', params: { id: alarmId } });
  };

  const openLock = () => {
    if (useStore.getState().activeAlarmId) return; // ring screen already handles it
    router.push('/locked');
  };

  // Keep OS alarms in sync with alarm list changes.
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

  // After hydration: resume a ring / lock that was active, or handle a native launch.
  useEffect(() => {
    const onReady = () => {
      const s = useStore.getState();
      const firedId = AlarmNative.takeFiredAlarmId();
      if (firedId) return openRing(firedId);
      if (s.activeAlarmId) return router.push({ pathname: '/ring/[id]', params: { id: s.activeAlarmId } });
      if (resumeLockIfNeeded()) openLock();
      else AppBlocker.takeLockLaunch();
    };
    if (useStore.getState().hydrated) onReady();
    const unsub = useStore.subscribe((s, prev) => {
      if (s.hydrated && !prev.hydrated) onReady();
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Native module events (app already running).
  useEffect(() => {
    const a = AlarmNative.addLaunchListener(({ alarmId }) => openRing(alarmId));
    const b = AppBlocker.addLockListener(() => {
      if (resumeLockIfNeeded()) openLock();
    });
    return () => {
      a.remove();
      b.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Foreground ticker (JS fallback; native builds fire through AlarmManager but this is harmless).
  useEffect(() => {
    const tick = () => {
      const { alarms, activeAlarmId, hydrated } = useStore.getState();
      if (!hydrated || activeAlarmId) return;
      const now = new Date();
      const key = minuteKey(now);
      for (const a of alarms) {
        if (!a.enabled || a.hour !== now.getHours() || a.minute !== now.getMinutes()) continue;
        if (a.days.length && !a.days.includes(now.getDay() as Weekday)) continue;
        if (fired.current[a.id] === key) continue;
        fired.current[a.id] = key;
        openRing(a.id);
        return;
      }
    };
    const id = setInterval(tick, 1000);
    const sub = AppState.addEventListener('change', (s) => {
      if (s !== 'active') return;
      const firedId = AlarmNative.takeFiredAlarmId();
      if (firedId) openRing(firedId);
      else tick();
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Notification tap → ring screen (non-native scheduling).
  useEffect(() => {
    const handle = (response: Notifications.NotificationResponse | null) => {
      const alarmId = response?.notification.request.content.data?.alarmId as string | undefined;
      if (alarmId) openRing(alarmId);
    };
    Notifications.getLastNotificationResponseAsync?.().then(handle).catch(() => {});
    const sub = Notifications.addNotificationResponseReceivedListener(handle);
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
