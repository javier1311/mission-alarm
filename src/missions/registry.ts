import type { TFunction } from 'i18next';

import type { IconName } from '@/components/ui';
import type { Mission, MissionType } from '@/store/types';
import { uid } from '@/utils/id';

export interface MissionMeta {
  type: MissionType;
  icon: IconName;
  /** i18n keys under missions.* */
  titleKey: string;
  descKey: string;
  /** Idle grace in seconds before the sound returns while the mission is in progress. */
  idleGraceSec: number;
  create: () => Mission;
}

/**
 * To add a new mission type: add it to MissionType, register it here,
 * add a config section in MissionConfig and a run component in missions/run.
 */
export const MISSIONS: MissionMeta[] = [
  {
    type: 'barcode',
    icon: 'barcode-outline',
    titleKey: 'barcode',
    descKey: 'barcodeDesc',
    idleGraceSec: 10,
    create: () => ({ id: uid(), type: 'barcode', code: '', format: '', label: '' }),
  },
  {
    type: 'fitness',
    icon: 'fitness-outline',
    titleKey: 'fitness',
    descKey: 'fitnessDesc',
    idleGraceSec: 3,
    create: () => ({ id: uid(), type: 'fitness', exercise: 'pushup', reps: 15 }),
  },
  {
    type: 'photo',
    icon: 'camera-outline',
    titleKey: 'photo',
    descKey: 'photoDesc',
    idleGraceSec: 10,
    create: () => ({ id: uid(), type: 'photo', requireOutdoors: true }),
  },
  {
    type: 'math',
    icon: 'calculator-outline',
    titleKey: 'math',
    descKey: 'mathDesc',
    idleGraceSec: 10,
    create: () => ({ id: uid(), type: 'math', difficulty: 'medium', count: 3 }),
  },
];

export const missionMeta = (type: MissionType) => MISSIONS.find((m) => m.type === type)!;

/** Short human summary for list rows, e.g. "Push-ups × 15". */
export function missionSummary(m: Mission, t: TFunction): string {
  switch (m.type) {
    case 'barcode':
      return m.label || (m.code ? m.code.slice(0, 18) : t('missions.scanCode'));
    case 'fitness':
      return `${t(`missions.${m.exercise}`)} × ${m.reps}`;
    case 'photo':
      return m.requireOutdoors ? 'GPS' : '';
    case 'math':
      return `${t(`missions.${m.difficulty}`)} × ${m.count}`;
  }
}

export const missionReady = (m: Mission) => (m.type === 'barcode' ? m.code.length > 0 : true);
