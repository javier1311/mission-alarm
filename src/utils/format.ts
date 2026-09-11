import type { TFunction } from 'i18next';

import type { Alarm } from '@/store/types';
import { nextFireDate, timeUntil } from '@/utils/time';

export function daysLabel(days: Alarm['days'], t: TFunction): string {
  if (days.length === 0) return t('alarms.once');
  if (days.length === 7) return t('alarms.everyDay');
  const sorted = [...days].sort();
  if (sorted.join() === '1,2,3,4,5') return t('alarms.weekdays');
  if (sorted.join() === '0,6') return t('alarms.weekends');
  const names = t('days.short', { returnObjects: true }) as string[];
  // Show Mon..Sun order
  const order = [1, 2, 3, 4, 5, 6, 0];
  return order.filter((d) => days.includes(d as Alarm['days'][number])).map((d) => names[d]).join(', ');
}

export function untilLabel(alarm: Alarm, t: TFunction): string | null {
  const next = nextFireDate(alarm);
  if (!next) return null;
  const { days, hours, minutes } = timeUntil(next);
  const parts: string[] = [];
  if (days) parts.push(t('alarms.dur_d', { count: days }));
  if (hours) parts.push(t('alarms.dur_h', { count: hours }));
  if (minutes || parts.length === 0) parts.push(t('alarms.dur_m', { count: minutes }));
  return parts.join(' ');
}

export function formatClock(h: number, m: number, use24h: boolean): { time: string; suffix: string } {
  const mm = m.toString().padStart(2, '0');
  if (use24h) return { time: `${h.toString().padStart(2, '0')}:${mm}`, suffix: '' };
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return { time: `${hh}:${mm}`, suffix };
}
