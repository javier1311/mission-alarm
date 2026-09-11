import type { StyleProp, ViewStyle } from 'react-native';

export interface PoseLandmark {
  x: number; // 0..1, relative to the upright frame
  y: number;
  score: number; // in-frame likelihood 0..1
}

export type LandmarkName =
  | 'nose'
  | 'leftShoulder'
  | 'rightShoulder'
  | 'leftElbow'
  | 'rightElbow'
  | 'leftWrist'
  | 'rightWrist'
  | 'leftHip'
  | 'rightHip'
  | 'leftKnee'
  | 'rightKnee'
  | 'leftAnkle'
  | 'rightAnkle';

export interface PoseEventPayload {
  landmarks: Partial<Record<LandmarkName, PoseLandmark>>;
  width: number;
  height: number;
  mirrored: boolean;
}

export type PoseCameraViewProps = {
  facing?: 'front' | 'back';
  onPose?: (event: { nativeEvent: PoseEventPayload }) => void;
  style?: StyleProp<ViewStyle>;
};
