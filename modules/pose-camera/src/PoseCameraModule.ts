import { NativeModule, requireOptionalNativeModule } from 'expo';

declare class PoseCameraModule extends NativeModule {
  isAvailable(): boolean;
}

const native = requireOptionalNativeModule<PoseCameraModule>('PoseCamera');

export default {
  /** False in Expo Go / web builds that lack the native module. */
  isAvailable: () => !!native,
};
