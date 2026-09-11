export interface WallpaperDef {
  id: string;
  /** Wallpaper is dark -> use light text on the ring screen. */
  dark: boolean;
  source: number;
  thumb: number;
}

export const WALLPAPERS: WallpaperDef[] = [
  { id: 'midnight', dark: true, source: require('../../assets/wallpapers/midnight.jpg'), thumb: require('../../assets/wallpapers/midnight_thumb.jpg') },
  { id: 'ember', dark: true, source: require('../../assets/wallpapers/ember.jpg'), thumb: require('../../assets/wallpapers/ember_thumb.jpg') },
  { id: 'ocean_night', dark: true, source: require('../../assets/wallpapers/ocean_night.jpg'), thumb: require('../../assets/wallpapers/ocean_night_thumb.jpg') },
  { id: 'forest_night', dark: true, source: require('../../assets/wallpapers/forest_night.jpg'), thumb: require('../../assets/wallpapers/forest_night_thumb.jpg') },
  { id: 'aurora', dark: true, source: require('../../assets/wallpapers/aurora.jpg'), thumb: require('../../assets/wallpapers/aurora_thumb.jpg') },
  { id: 'graphite_circle', dark: true, source: require('../../assets/wallpapers/graphite_circle.jpg'), thumb: require('../../assets/wallpapers/graphite_circle_thumb.jpg') },
  { id: 'deep_blue', dark: true, source: require('../../assets/wallpapers/deep_blue.jpg'), thumb: require('../../assets/wallpapers/deep_blue_thumb.jpg') },
  { id: 'olive', dark: true, source: require('../../assets/wallpapers/olive.jpg'), thumb: require('../../assets/wallpapers/olive_thumb.jpg') },
  { id: 'sunset', dark: true, source: require('../../assets/wallpapers/sunset.jpg'), thumb: require('../../assets/wallpapers/sunset_thumb.jpg') },
  { id: 'coral', dark: true, source: require('../../assets/wallpapers/coral.jpg'), thumb: require('../../assets/wallpapers/coral_thumb.jpg') },
  { id: 'paper', dark: false, source: require('../../assets/wallpapers/paper.jpg'), thumb: require('../../assets/wallpapers/paper_thumb.jpg') },
  { id: 'dawn', dark: false, source: require('../../assets/wallpapers/dawn.jpg'), thumb: require('../../assets/wallpapers/dawn_thumb.jpg') },
  { id: 'mint', dark: false, source: require('../../assets/wallpapers/mint.jpg'), thumb: require('../../assets/wallpapers/mint_thumb.jpg') },
  { id: 'sky', dark: false, source: require('../../assets/wallpapers/sky.jpg'), thumb: require('../../assets/wallpapers/sky_thumb.jpg') },
  { id: 'peach', dark: false, source: require('../../assets/wallpapers/peach.jpg'), thumb: require('../../assets/wallpapers/peach_thumb.jpg') },
  { id: 'lavender', dark: false, source: require('../../assets/wallpapers/lavender.jpg'), thumb: require('../../assets/wallpapers/lavender_thumb.jpg') },
];

export const wallpaperById = (id: string) => WALLPAPERS.find((w) => w.id === id);
