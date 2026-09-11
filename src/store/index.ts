import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Alarm, CustomSound, CustomWallpaper, LockState, Settings } from './types';

interface State {
  alarms: Alarm[];
  customSounds: CustomSound[];
  customWallpapers: CustomWallpaper[];
  settings: Settings;
  /** Alarm currently ringing (survives app restarts so we can resume the ring screen). */
  activeAlarmId: string | null;
  lock: LockState | null;
  hydrated: boolean;

  upsertAlarm: (alarm: Alarm) => void;
  removeAlarm: (id: string) => void;
  toggleAlarm: (id: string, enabled: boolean) => void;
  addCustomSound: (s: CustomSound) => void;
  removeCustomSound: (id: string) => void;
  addCustomWallpaper: (w: CustomWallpaper) => void;
  removeCustomWallpaper: (id: string) => void;
  setSettings: (patch: Partial<Settings>) => void;
  setActiveAlarm: (id: string | null) => void;
  setLock: (lock: LockState | null) => void;
}

export const useStore = create<State>()(
  persist(
    (set) => ({
      alarms: [],
      customSounds: [],
      customWallpapers: [],
      settings: { themeMode: 'system', language: null, use24h: true },
      activeAlarmId: null,
      lock: null,
      hydrated: false,

      upsertAlarm: (alarm) =>
        set((s) => {
          const i = s.alarms.findIndex((a) => a.id === alarm.id);
          const alarms = [...s.alarms];
          if (i >= 0) alarms[i] = alarm;
          else alarms.push(alarm);
          alarms.sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute));
          return { alarms };
        }),
      removeAlarm: (id) => set((s) => ({ alarms: s.alarms.filter((a) => a.id !== id) })),
      toggleAlarm: (id, enabled) =>
        set((s) => ({ alarms: s.alarms.map((a) => (a.id === id ? { ...a, enabled } : a)) })),
      addCustomSound: (snd) => set((s) => ({ customSounds: [...s.customSounds, snd] })),
      removeCustomSound: (id) => set((s) => ({ customSounds: s.customSounds.filter((x) => x.id !== id) })),
      addCustomWallpaper: (w) => set((s) => ({ customWallpapers: [...s.customWallpapers, w] })),
      removeCustomWallpaper: (id) =>
        set((s) => ({ customWallpapers: s.customWallpapers.filter((x) => x.id !== id) })),
      setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      setActiveAlarm: (id) => set({ activeAlarmId: id }),
      setLock: (lock) => set({ lock }),
    }),
    {
      name: 'mission-alarm-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        alarms: s.alarms,
        customSounds: s.customSounds,
        customWallpapers: s.customWallpapers,
        settings: s.settings,
        activeAlarmId: s.activeAlarmId,
        lock: s.lock,
      }),
      onRehydrateStorage: () => (state) => {
        state && useStore.setState({ hydrated: true });
      },
    },
  ),
);
