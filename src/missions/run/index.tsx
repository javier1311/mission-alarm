import type { Mission } from '@/store/types';

import { BarcodeRun } from './BarcodeRun';
import { FitnessRun } from './FitnessRun';
import { MathRun } from './MathRun';
import { PhotoRun } from './PhotoRun';
import type { MissionRunProps } from './types';

export function MissionRun(props: MissionRunProps<Mission>) {
  const { mission } = props;
  switch (mission.type) {
    case 'barcode':
      return <BarcodeRun {...props} mission={mission} />;
    case 'fitness':
      return <FitnessRun {...props} mission={mission} />;
    case 'photo':
      return <PhotoRun {...props} mission={mission} />;
    case 'math':
      return <MathRun {...props} mission={mission} />;
  }
}
