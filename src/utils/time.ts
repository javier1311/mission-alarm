import type { Alarm, Weekday } from '@/store/types';

export const pad2 = (n: number) => n.toString().padStart(2, '0');
export const fmtTime = (h: number, m: number) => `${pad2(h)}:${pad2(m)}`;

/** Next Date at which the alarm should fire, or null when disabled. */
export function nextFireDate(alarm: Alarm, from: Date = new Date()): Date | null {
  if (!alarm.enabled) return null;
  const candidate = new Date(from);
  candidate.setHours(alarm.hour, alarm.minute, 0, 0);
  if (alarm.days.length === 0) {
    if (candidate <= from) candidate.setDate(candidate.getDate() + 1);
    return candidate;
  }
  for (let i = 0; i < 8; i++) {
    const d = new Date(candidate);
    d.setDate(candidate.getDate() + i);
    if (alarm.days.includes(d.getDay() as Weekday) && d > from) return d;
  }
  return null;
}

export function timeUntil(target: Date, from: Date = new Date()) {
  const ms = Math.max(0, target.getTime() - from.getTime());
  const totalMin = Math.round(ms / 60000);
  return { days: Math.floor(totalMin / 1440), hours: Math.floor((totalMin % 1440) / 60), minutes: totalMin % 60 };
}
