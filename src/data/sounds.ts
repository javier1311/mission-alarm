export type SoundCategory = 'trend' | 'classic';

export interface SoundDef {
  id: string;
  category: SoundCategory;
  /** i18n key under sounds.* */
  nameKey: string;
  source: number; // require()
}

// All bundled sounds are from Mixkit (https://mixkit.co/license/) — free for commercial use.
export const SOUNDS: SoundDef[] = [
  { id: 'trend_trap_electro_vibes', category: 'trend', nameKey: 'trapElectro', source: require('../../assets/sounds/trend_trap_electro_vibes.mp3') },
  { id: 'trend_hip_hop_02', category: 'trend', nameKey: 'hipHop', source: require('../../assets/sounds/trend_hip_hop_02.mp3') },
  { id: 'trend_trap', category: 'trend', nameKey: 'trap', source: require('../../assets/sounds/trend_trap.mp3') },
  { id: 'trend_need_for_speed', category: 'trend', nameKey: 'needForSpeed', source: require('../../assets/sounds/trend_need_for_speed.mp3') },
  { id: 'trend_one_more_dance', category: 'trend', nameKey: 'oneMoreDance', source: require('../../assets/sounds/trend_one_more_dance.mp3') },
  { id: 'trend_feeling_happy', category: 'trend', nameKey: 'feelingHappy', source: require('../../assets/sounds/trend_feeling_happy.mp3') },
  { id: 'trend_digital_clouds', category: 'trend', nameKey: 'digitalClouds', source: require('../../assets/sounds/trend_digital_clouds.mp3') },
  { id: 'trend_uplifting_bass', category: 'trend', nameKey: 'upliftingBass', source: require('../../assets/sounds/trend_uplifting_bass.mp3') },
  { id: 'trend_island_beat', category: 'trend', nameKey: 'islandBeat', source: require('../../assets/sounds/trend_island_beat.mp3') },
  { id: 'trend_midnight_funk', category: 'trend', nameKey: 'midnightFunk', source: require('../../assets/sounds/trend_midnight_funk.mp3') },

  { id: 'classic_classic_alarm', category: 'classic', nameKey: 'classicAlarm', source: require('../../assets/sounds/classic_classic_alarm.mp3') },
  { id: 'classic_digital_clock_buzzer', category: 'classic', nameKey: 'digitalBuzzer', source: require('../../assets/sounds/classic_digital_clock_buzzer.mp3') },
  { id: 'classic_morning_clock_alarm', category: 'classic', nameKey: 'morningClock', source: require('../../assets/sounds/classic_morning_clock_alarm.mp3') },
  { id: 'classic_alarm_clock_beep', category: 'classic', nameKey: 'clockBeep', source: require('../../assets/sounds/classic_alarm_clock_beep.mp3') },
  { id: 'classic_digital_clock_beep', category: 'classic', nameKey: 'digitalBeep', source: require('../../assets/sounds/classic_digital_clock_beep.mp3') },
  { id: 'classic_vintage_warning_alarm', category: 'classic', nameKey: 'vintageWarning', source: require('../../assets/sounds/classic_vintage_warning_alarm.mp3') },
  { id: 'classic_warning_buzzer', category: 'classic', nameKey: 'warningBuzzer', source: require('../../assets/sounds/classic_warning_buzzer.mp3') },
  { id: 'classic_alert_alarm', category: 'classic', nameKey: 'alertAlarm', source: require('../../assets/sounds/classic_alert_alarm.mp3') },
  { id: 'classic_rooster_morning', category: 'classic', nameKey: 'rooster', source: require('../../assets/sounds/classic_rooster_morning.mp3') },
  { id: 'classic_retro_game_alarm', category: 'classic', nameKey: 'retroGame', source: require('../../assets/sounds/classic_retro_game_alarm.mp3') },
  { id: 'classic_city_siren_loop', category: 'classic', nameKey: 'citySiren', source: require('../../assets/sounds/classic_city_siren_loop.mp3') },
  { id: 'classic_spaceship_alarm', category: 'classic', nameKey: 'spaceship', source: require('../../assets/sounds/classic_spaceship_alarm.mp3') },
  { id: 'classic_battleship_alarm', category: 'classic', nameKey: 'battleship', source: require('../../assets/sounds/classic_battleship_alarm.mp3') },
  { id: 'classic_critical_alarm', category: 'classic', nameKey: 'critical', source: require('../../assets/sounds/classic_critical_alarm.mp3') },
  { id: 'classic_urgent_tone_loop', category: 'classic', nameKey: 'urgentTone', source: require('../../assets/sounds/classic_urgent_tone_loop.mp3') },
  { id: 'classic_church_bell', category: 'classic', nameKey: 'churchBell', source: require('../../assets/sounds/classic_church_bell.mp3') },
  { id: 'classic_church_bell_loop', category: 'classic', nameKey: 'bellLoop', source: require('../../assets/sounds/classic_church_bell_loop.mp3') },
  { id: 'classic_flute_melody', category: 'classic', nameKey: 'flute', source: require('../../assets/sounds/classic_flute_melody.mp3') },
  { id: 'classic_little_birds', category: 'classic', nameKey: 'littleBirds', source: require('../../assets/sounds/classic_little_birds.mp3') },
  { id: 'classic_morning_birds', category: 'classic', nameKey: 'morningBirds', source: require('../../assets/sounds/classic_morning_birds.mp3') },
];

export const soundById = (id: string) => SOUNDS.find((s) => s.id === id);
export const isCustomId = (id: string) => id.startsWith('custom:');
