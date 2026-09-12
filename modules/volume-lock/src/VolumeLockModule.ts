import { NativeModule, requireOptionalNativeModule } from 'expo';

declare class VolumeLockModule extends NativeModule {
  lock(volume: number): void;
  unlock(): void;
  isSupported(): boolean;
}

const native = requireOptionalNativeModule<VolumeLockModule>('VolumeLock');

/** Pins the system volume while the alarm rings. No-op where the native module is absent. */
export const VolumeLock = {
  isSupported: () => !!native,
  lock: (volume: number) => native?.lock(volume),
  unlock: () => native?.unlock(),
};

export default VolumeLock;
