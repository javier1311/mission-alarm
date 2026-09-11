import { AppBlocker } from '@modules/app-blocker';
import { useStore } from '@/store';
import type { Alarm, LockState, UnlockRule } from '@/store/types';

/** Hard cap so a bug can never lock the phone for longer than this. */
export const MAX_LOCK_MS = 3 * 60 * 60 * 1000;

export const blockingAvailable = () => AppBlocker.isSupported();

export const blockingPermissionsGranted = () =>
  AppBlocker.isSupported() && AppBlocker.hasUsageAccess() && AppBlocker.hasOverlayPermission();

/** Called when the alarm starts ringing: lock everything until the mission is done. */
export function startRingLock(alarm: Alarm) {
  if (!alarm.blocking.enabled || !blockingPermissionsGranted()) return;
  AppBlocker.start(Date.now() + MAX_LOCK_MS);
}

/**
 * Called when the alarm is dismissed. Either releases the lock or converts it
 * into a post-alarm lock according to the alarm's unlock rule.
 */
export function finishRingLock(alarm: Alarm) {
  const { setLock } = useStore.getState();
  if (!alarm.blocking.enabled || !blockingPermissionsGranted()) {
    setLock(null);
    return;
  }
  const until = lockDeadline(alarm.blocking.unlock);
  if (!until || until <= Date.now()) {
    AppBlocker.stop();
    setLock(null);
    return;
  }
  const lock: LockState = { alarmId: alarm.id, rule: alarm.blocking.unlock, until, startedAt: Date.now() };
  setLock(lock);
  AppBlocker.start(until);
}

function lockDeadline(rule: UnlockRule): number | null {
  const now = Date.now();
  switch (rule.kind) {
    case 'none':
      return null;
    case 'time': {
      const d = new Date();
      d.setHours(rule.hour, rule.minute, 0, 0);
      if (d.getTime() <= now) return null; // unlock time already passed today
      return Math.min(d.getTime(), now + MAX_LOCK_MS);
    }
    case 'mission':
      return rule.missions.length ? now + MAX_LOCK_MS : null;
    case 'location':
      return rule.lat === 0 && rule.lng === 0 ? null : now + MAX_LOCK_MS;
  }
}

/** Release the post-alarm lock (rule satisfied / expired). */
export function releaseLock() {
  AppBlocker.stop();
  useStore.getState().setLock(null);
}

/** On app start: make sure the native service is running if a lock is still active. */
export function resumeLockIfNeeded(): boolean {
  const { lock, setLock } = useStore.getState();
  if (!lock) return false;
  if (lock.until <= Date.now()) {
    setLock(null);
    AppBlocker.stop();
    return false;
  }
  if (blockingAvailable() && !AppBlocker.isRunning()) AppBlocker.start(lock.until);
  return true;
}
