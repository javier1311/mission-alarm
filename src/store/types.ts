export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday (JS Date convention)

export type MissionType = 'barcode' | 'fitness' | 'photo' | 'math';

export interface BarcodeMission {
  id: string;
  type: 'barcode';
  /** Raw scanned value the user registered when configuring the mission. */
  code: string;
  format: string;
  label: string;
}

export type Exercise = 'pushup' | 'squat';

export interface FitnessMission {
  id: string;
  type: 'fitness';
  exercise: Exercise;
  reps: number;
}

export interface PhotoMission {
  id: string;
  type: 'photo';
  /** Require GPS to confirm the user is actually outdoors (not just a photo). */
  requireOutdoors: boolean;
}

export type MathDifficulty = 'easy' | 'medium' | 'hard';

export interface MathMission {
  id: string;
  type: 'math';
  difficulty: MathDifficulty;
  count: number;
}

export type Mission = BarcodeMission | FitnessMission | PhotoMission | MathMission;

export type UnlockRule =
  | { kind: 'none' }
  | { kind: 'time'; hour: number; minute: number }
  | { kind: 'mission'; missions: Mission[] }
  | { kind: 'location'; mode: 'leaveHome' | 'reachWork'; lat: number; lng: number; radiusM: number };

export interface BlockingConfig {
  /** Block other apps while the alarm rings / mission is unfinished. */
  enabled: boolean;
  /** Keep blocking after the alarm is dismissed until this rule is satisfied. */
  unlock: UnlockRule;
}

export interface Alarm {
  id: string;
  hour: number;
  minute: number;
  days: Weekday[]; // empty = one-time
  enabled: boolean;
  label: string;
  soundId: string; // id from sounds registry or 'custom:<uri>'
  wallpaperId: string; // id from wallpapers registry or 'custom:<uri>'
  volume: number; // 0..1
  vibrate: boolean;
  missions: Mission[];
  /** How many times the user may press "mute" before it stops working. null = unlimited */
  muteLimit: number | null;
  /** Seconds of silence granted per mute press / mission window. */
  missionWindowSec: number;
  blocking: BlockingConfig;
  createdAt: number;
}

/** Active post-alarm app lock (persisted so it survives app restarts). */
export interface LockState {
  alarmId: string;
  rule: UnlockRule;
  /** Hard deadline (epoch ms) after which the lock ends no matter what. */
  until: number;
  startedAt: number;
}

export interface CustomSound {
  id: string; // 'custom:<uid>'
  name: string;
  uri: string; // file in app documents dir
}

export interface CustomWallpaper {
  id: string; // 'custom:<uid>'
  uri: string;
}

export interface Settings {
  themeMode: 'system' | 'light' | 'dark';
  language: string | null; // null = follow device
  use24h: boolean;
}

export const defaultAlarm = (id: string): Alarm => ({
  id,
  hour: 7,
  minute: 0,
  days: [1, 2, 3, 4, 5],
  enabled: true,
  label: '',
  soundId: 'classic_classic_alarm',
  wallpaperId: 'midnight',
  volume: 0.8,
  vibrate: true,
  missions: [],
  muteLimit: 3,
  missionWindowSec: 10,
  blocking: { enabled: false, unlock: { kind: 'none' } },
  createdAt: Date.now(),
});
