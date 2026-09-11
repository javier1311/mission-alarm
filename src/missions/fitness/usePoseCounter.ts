import { useCallback, useEffect, useRef, useState } from 'react';

import type { PoseEventPayload } from '@modules/pose-camera';
import { PoseCameraModule } from '@modules/pose-camera';
import type { Exercise } from '@/store/types';

import { type Keypoint, type Pose, RepCounter } from './repCounter';

export interface PoseCounterState {
  /** Native pose detector is available in this build. */
  supported: boolean;
  /** A full body is visible right now. */
  visible: boolean;
  /** Exercise motion detected within the idle window. */
  active: boolean;
  count: number;
}

const ZERO: Keypoint = { x: 0, y: 0, score: 0 };

/**
 * Bridges the native PoseCameraView (ML Kit) with the pure RepCounter.
 * Feed `onPose` events from the view; read count / visible / active.
 */
export function usePoseCounter(exercise: Exercise, idleMs: number) {
  const counter = useRef(new RepCounter(exercise));
  const [state, setState] = useState<PoseCounterState>({
    supported: PoseCameraModule.isAvailable(),
    visible: false,
    active: false,
    count: 0,
  });

  useEffect(() => {
    counter.current = new RepCounter(exercise);
  }, [exercise]);

  useEffect(() => {
    const id = setInterval(() => {
      const c = counter.current;
      const now = Date.now();
      setState((s) => {
        const next = {
          ...s,
          visible: now - c.lastVisible < 1000,
          active: now - c.lastActivity < idleMs,
          count: c.count,
        };
        return next.visible === s.visible && next.active === s.active && next.count === s.count ? s : next;
      });
    }, 200);
    return () => clearInterval(id);
  }, [idleMs]);

  const onPose = useCallback((e: { nativeEvent: PoseEventPayload }) => {
    const l = e.nativeEvent.landmarks;
    const pose: Pose = {
      leftShoulder: l.leftShoulder ?? ZERO,
      rightShoulder: l.rightShoulder ?? ZERO,
      leftElbow: l.leftElbow ?? ZERO,
      rightElbow: l.rightElbow ?? ZERO,
      leftWrist: l.leftWrist ?? ZERO,
      rightWrist: l.rightWrist ?? ZERO,
      leftHip: l.leftHip ?? ZERO,
      rightHip: l.rightHip ?? ZERO,
      leftKnee: l.leftKnee ?? ZERO,
      rightKnee: l.rightKnee ?? ZERO,
      leftAnkle: l.leftAnkle ?? ZERO,
      rightAnkle: l.rightAnkle ?? ZERO,
    };
    counter.current.update(pose);
  }, []);

  return { ...state, onPose };
}
