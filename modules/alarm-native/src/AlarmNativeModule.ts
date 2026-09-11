import { NativeModule, requireOptionalNativeModule } from 'expo';

export type AlarmNativeEvents = {
  onAlarmLaunch: (e: { alarmId: string }) => void;
};

declare class AlarmNativeModule extends NativeModule<AlarmNativeEvents> {
  isSupported(): boolean;
  schedule(id: string, triggerAt: number, label: string, stopText: string, missionText: string): void;
  cancel(id: string): void;
  cancelAll(): void;
  takeFiredAlarmId(): string | null;
  stop(id: string): void;
  requestAuthorization(): Promise<boolean>;
  dismissNotification(): void;
  canScheduleExact(): boolean;
  openExactAlarmSettings(): void;
  showOverLockScreen(enabled: boolean): void;
}

const native = requireOptionalNativeModule<AlarmNativeModule>('AlarmNative');

/** Safe wrapper: no-ops when the native module is absent (Expo Go / web). */
export const AlarmNative = {
  isSupported: () => !!native && native.isSupported(),
  /** stopText / missionText label the buttons of the OS alarm alert (iOS AlarmKit). */
  schedule: (id: string, triggerAt: number, label: string, stopText: string, missionText: string) =>
    native?.schedule(id, triggerAt, label, stopText, missionText),
  cancel: (id: string) => native?.cancel(id),
  cancelAll: () => native?.cancelAll(),
  takeFiredAlarmId: () => native?.takeFiredAlarmId() ?? null,
  dismissNotification: () => native?.dismissNotification(),
  /** Stop the OS-level alert for this alarm (JS ring screen has taken over). */
  stop: (id: string) => native?.stop(id),
  requestAuthorization: () => native?.requestAuthorization() ?? Promise.resolve(false),
  canScheduleExact: () => native?.canScheduleExact() ?? true,
  openExactAlarmSettings: () => native?.openExactAlarmSettings(),
  showOverLockScreen: (enabled: boolean) => native?.showOverLockScreen(enabled),
  addLaunchListener: (fn: (e: { alarmId: string }) => void) => native?.addListener('onAlarmLaunch', fn) ?? { remove() {} },
};

export default AlarmNative;
