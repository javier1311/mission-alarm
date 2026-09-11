import type { Exercise } from '@/store/types';

/** Normalised 2D keypoint with confidence, as produced by ML Kit / MediaPipe pose. */
export interface Keypoint {
  x: number;
  y: number;
  score: number;
}

/** Subset of body landmarks the counter needs (either body side). */
export interface Pose {
  leftShoulder: Keypoint;
  rightShoulder: Keypoint;
  leftElbow: Keypoint;
  rightElbow: Keypoint;
  leftWrist: Keypoint;
  rightWrist: Keypoint;
  leftHip: Keypoint;
  rightHip: Keypoint;
  leftKnee: Keypoint;
  rightKnee: Keypoint;
  leftAnkle: Keypoint;
  rightAnkle: Keypoint;
}

const MIN_SCORE = 0.5;

/** Angle ABC in degrees. */
export function angle(a: Keypoint, b: Keypoint, c: Keypoint): number {
  const abx = a.x - b.x, aby = a.y - b.y, cbx = c.x - b.x, cby = c.y - b.y;
  const dot = abx * cbx + aby * cby;
  const mag = Math.hypot(abx, aby) * Math.hypot(cbx, cby);
  if (mag === 0) return 180;
  return (Math.acos(Math.max(-1, Math.min(1, dot / mag))) * 180) / Math.PI;
}

const visible = (...k: Keypoint[]) => k.every((p) => p.score >= MIN_SCORE);

/** Pick the better-visible side and return the joint angle relevant to the exercise, or null if not visible. */
export function exerciseAngle(pose: Pose, exercise: Exercise): number | null {
  const sides =
    exercise === 'pushup'
      ? [
          [pose.leftShoulder, pose.leftElbow, pose.leftWrist],
          [pose.rightShoulder, pose.rightElbow, pose.rightWrist],
        ]
      : [
          [pose.leftHip, pose.leftKnee, pose.leftAnkle],
          [pose.rightHip, pose.rightKnee, pose.rightAnkle],
        ];
  const candidates = sides.filter((s) => visible(...s));
  if (candidates.length === 0) return null;
  const angles = candidates.map(([a, b, c]) => angle(a, b, c));
  return angles.reduce((x, y) => x + y, 0) / angles.length;
}

/** Additional sanity check so waving arms doesn't count as push-ups: body must be roughly horizontal. */
export function bodyOrientationOk(pose: Pose, exercise: Exercise): boolean {
  const s = pose.leftShoulder.score >= pose.rightShoulder.score ? pose.leftShoulder : pose.rightShoulder;
  const h = pose.leftHip.score >= pose.rightHip.score ? pose.leftHip : pose.rightHip;
  if (!visible(s, h)) return false;
  const dx = Math.abs(s.x - h.x), dy = Math.abs(s.y - h.y);
  // push-up: torso closer to horizontal; squat: torso closer to vertical
  return exercise === 'pushup' ? dx > dy * 0.8 : dy > dx;
}

const THRESHOLDS: Record<Exercise, { down: number; up: number }> = {
  pushup: { down: 95, up: 150 },
  squat: { down: 105, up: 160 },
};

export type Phase = 'unknown' | 'up' | 'down';

/**
 * Counts repetitions from a stream of poses. Pure state machine — feed it
 * `update(pose, now)` per frame and read `count`, `phase`, `lastActivity`.
 */
export class RepCounter {
  count = 0;
  phase: Phase = 'unknown';
  /** Timestamp (ms) of the last frame that showed exercise-like movement. */
  lastActivity = 0;
  /** Timestamp of last frame with a usable pose. */
  lastVisible = 0;
  private lastAngle: number | null = null;

  constructor(readonly exercise: Exercise) {}

  update(pose: Pose, now: number = Date.now()) {
    const a = exerciseAngle(pose, this.exercise);
    if (a === null || !bodyOrientationOk(pose, this.exercise)) {
      this.lastAngle = null;
      return;
    }
    this.lastVisible = now;
    const { down, up } = THRESHOLDS[this.exercise];
    // Any noticeable joint motion counts as activity (keeps the alarm silent).
    if (this.lastAngle !== null && Math.abs(a - this.lastAngle) > 4) this.lastActivity = now;
    this.lastAngle = a;

    if (a < down) {
      if (this.phase !== 'down') {
        this.phase = 'down';
        this.lastActivity = now;
      }
    } else if (a > up) {
      if (this.phase === 'down') {
        this.count += 1;
        this.lastActivity = now;
      }
      this.phase = 'up';
    }
  }

  reset() {
    this.count = 0;
    this.phase = 'unknown';
    this.lastAngle = null;
  }
}
