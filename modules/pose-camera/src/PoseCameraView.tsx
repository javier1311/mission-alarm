import { requireNativeView } from 'expo';
import * as React from 'react';
import { View } from 'react-native';

import { PoseCameraViewProps } from './PoseCamera.types';
import PoseCameraModule from './PoseCameraModule';

let NativeView: React.ComponentType<PoseCameraViewProps> | null = null;
if (PoseCameraModule.isAvailable()) {
  NativeView = requireNativeView('PoseCamera');
}

export default function PoseCameraView(props: PoseCameraViewProps) {
  if (!NativeView) return <View style={[{ backgroundColor: '#000' }, props.style]} />;
  return <NativeView facing="front" {...props} />;
}
