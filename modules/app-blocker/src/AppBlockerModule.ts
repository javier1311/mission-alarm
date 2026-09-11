import { NativeModule, requireOptionalNativeModule } from 'expo';

export type AppBlockerEvents = {
  onLockLaunch: (e: { locked: boolean }) => void;
};

declare class AppBlockerModule extends NativeModule<AppBlockerEvents> {
  isSupported(): boolean;
  hasUsageAccess(): boolean;
  openUsageAccessSettings(): void;
  hasOverlayPermission(): boolean;
  openOverlaySettings(): void;
  isIgnoringBatteryOptimizations(): boolean;
  openBatterySettings(): void;
  start(until: number, allowed: string[]): void;
  stop(): void;
  isRunning(): boolean;
  takeLockLaunch(): boolean;
}

const native = requireOptionalNativeModule<AppBlockerModule>('AppBlocker');

/** Safe wrapper: no-ops when the native module is absent (Expo Go / web / iOS). */
export const AppBlocker = {
  isSupported: () => !!native && native.isSupported(),
  hasUsageAccess: () => native?.hasUsageAccess() ?? false,
  openUsageAccessSettings: () => native?.openUsageAccessSettings(),
  hasOverlayPermission: () => native?.hasOverlayPermission() ?? false,
  openOverlaySettings: () => native?.openOverlaySettings(),
  isIgnoringBatteryOptimizations: () => native?.isIgnoringBatteryOptimizations() ?? true,
  openBatterySettings: () => native?.openBatterySettings(),
  start: (until: number, allowed: string[] = []) => native?.start(until, allowed),
  stop: () => native?.stop(),
  isRunning: () => native?.isRunning() ?? false,
  takeLockLaunch: () => native?.takeLockLaunch() ?? false,
  addLockListener: (fn: (e: { locked: boolean }) => void) => native?.addListener('onLockLaunch', fn) ?? { remove() {} },
};

export default AppBlocker;
