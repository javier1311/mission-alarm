import { useCallback, useEffect, useRef, useState } from 'react';

import { alarmPlayer } from '@/audio/alarmPlayer';
import { missionMeta } from '@/missions/registry';
import type { Alarm } from '@/store/types';

export type RingPhase = 'ringing' | 'mission' | 'done';

export interface RingState {
  phase: RingPhase;
  missionIndex: number;
  mutesLeft: number | null;
  soundOn: boolean;
  /** Seconds of silence left (0 when sound is on). */
  silenceLeft: number;
}

/**
 * Alarm ring state machine.
 *
 *  ringing ──"do mission" (consumes a mute press)──▶ mission (silent for missionWindowSec)
 *  mission: no progress before the window ends ──▶ sound returns; mission stays open
 *  mission: activity (rep, correct answer…) ──▶ silent again for the mission's grace window
 *  mission complete ──▶ next mission (fresh window) or done
 */
export function useRingSession(alarm: Alarm, onFinished: () => void) {
  const [state, setState] = useState<RingState>({
    phase: 'ringing',
    missionIndex: 0,
    mutesLeft: alarm.muteLimit,
    soundOn: true,
    silenceLeft: 0,
  });
  const ref = useRef(state);
  const silenceUntil = useRef(0);
  const finished = useRef(false);

  const update = useCallback((patch: Partial<RingState>) => {
    ref.current = { ...ref.current, ...patch };
    setState(ref.current);
  }, []);

  // Start ringing.
  useEffect(() => {
    alarmPlayer.start(alarm.soundId, alarm.volume, alarm.vibrate);
    return () => {
      alarmPlayer.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alarm.id]);

  const silence = useCallback(
    (sec: number) => {
      silenceUntil.current = Math.max(silenceUntil.current, Date.now() + sec * 1000);
      alarmPlayer.mute();
      update({ soundOn: false, silenceLeft: Math.ceil((silenceUntil.current - Date.now()) / 1000) });
    },
    [update],
  );

  // Ticker: bring the sound back when the silence window expires.
  useEffect(() => {
    const id = setInterval(() => {
      const s = ref.current;
      if (s.phase === 'done') return;
      const left = Math.max(0, Math.ceil((silenceUntil.current - Date.now()) / 1000));
      if (!s.soundOn && left === 0) {
        alarmPlayer.unmute(alarm.vibrate);
        update({ soundOn: true, silenceLeft: 0 });
      } else if (left !== s.silenceLeft) {
        update({ silenceLeft: left });
      }
    }, 250);
    return () => clearInterval(id);
  }, [alarm.vibrate, update]);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    alarmPlayer.stop();
    update({ phase: 'done', soundOn: false, silenceLeft: 0 });
    onFinished();
  }, [onFinished, update]);

  /** "Do mission" / "Silence" button. */
  const startMission = useCallback(() => {
    if (alarm.missions.length === 0) return finish();
    const s = ref.current;
    const canMute = s.mutesLeft === null || s.mutesLeft > 0;
    if (canMute && s.soundOn) {
      update({ phase: 'mission', mutesLeft: s.mutesLeft === null ? null : s.mutesLeft - 1 });
      silence(alarm.missionWindowSec);
    } else {
      update({ phase: 'mission' });
    }
  }, [alarm.missions.length, alarm.missionWindowSec, finish, silence, update]);

  /** Mission reported progress — keep (or make) it silent for the mission's grace window. */
  const activity = useCallback(() => {
    const s = ref.current;
    if (s.phase !== 'mission') return;
    const m = alarm.missions[s.missionIndex];
    if (m) silence(missionMeta(m.type).idleGraceSec);
  }, [alarm.missions, silence]);

  const completeMission = useCallback(() => {
    const next = ref.current.missionIndex + 1;
    if (next >= alarm.missions.length) return finish();
    update({ missionIndex: next });
    silence(alarm.missionWindowSec);
  }, [alarm.missions.length, alarm.missionWindowSec, finish, silence, update]);

  return { state, startMission, activity, completeMission, finish };
}
