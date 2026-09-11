import { useEffect, useRef, useState } from 'react';

import type { Exercise } from '@/store/types';

import { type Pose, RepCounter } from './repCounter';

export interface PoseCounterState {
  /** Native pose detector is available in this build. */
  supported: boolean;
  /** A full body is visible right now. */
  visible: boolean;
  /** Exercise motion detected within the idle window. */
  active: boolean;
  count: number;
}

/**
 * Bridges the native pose detector (phase 3: react-native-vision-camera +
 * ML Kit pose frame processor) with the pure RepCounter.
 *
 * In this JS-only build there is no detector, so `supported` is false and the
 * mission screen shows the "native build required" hint. `feed()` is exposed so
 * the native frame processor can push poses without touching the UI code.
 */
export function usePoseCounter(exercise: Exercise, idleMs: number): PoseCounterState & { feed: (pose: Pose) => void } {
  const counter = useRef(new RepCounter(exercise));
  const [state, setState] = useState<PoseCounterState>({ supported: false, visible: false, active: false, count: 0 });

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

  const feed = (pose: Pose) => {
    counter.current.update(pose);
    if (!state.supported) setState((s) => ({ ...s, supported: true }));
  };

  return { ...state, feed };
}
