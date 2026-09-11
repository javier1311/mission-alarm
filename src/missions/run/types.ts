import type { Mission } from '@/store/types';

export interface MissionRunProps<M extends Mission = Mission> {
  mission: M;
  /** Meaningful progress happened: silence the alarm (again) for the mission's grace window. */
  onActivity: () => void;
  onComplete: () => void;
  /** Whether the alarm sound is currently playing (mission UI may show a hint). */
  soundOn: boolean;
  /** Text colour to use over the wallpaper. */
  fg: string;
}
