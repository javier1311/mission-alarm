import { type AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { Vibration } from 'react-native';

import { isCustomId, soundById } from '@/data/sounds';
import { useStore } from '@/store';

/**
 * Single looping alarm player. Kept outside React so the ring screen can
 * mute/unmute without re-creating the player.
 */
class AlarmPlayer {
  private player: AudioPlayer | null = null;
  private vibrating = false;

  resolveSource(soundId: string): number | { uri: string } | null {
    if (isCustomId(soundId)) {
      const custom = useStore.getState().customSounds.find((s) => s.id === soundId);
      return custom ? { uri: custom.uri } : soundById('classic_classic_alarm')!.source;
    }
    return soundById(soundId)?.source ?? null;
  }

  async start(soundId: string, volume: number, vibrate: boolean) {
    await this.stop();
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    }).catch(() => {});
    const source = this.resolveSource(soundId);
    if (!source) return;
    const p = createAudioPlayer(source, { keepAudioSessionActive: true });
    p.loop = true;
    p.volume = volume;
    p.play();
    this.player = p;
    if (vibrate) this.startVibration();
  }

  /** Preview a sound once (sound picker). */
  async preview(soundId: string) {
    await this.stop();
    const source = this.resolveSource(soundId);
    if (!source) return;
    const p = createAudioPlayer(source);
    p.loop = false;
    p.volume = 1;
    p.play();
    this.player = p;
  }

  mute() {
    this.player?.pause();
    this.stopVibration();
  }

  unmute(vibrate: boolean) {
    if (this.player) {
      this.player.seekTo(0).catch(() => {});
      this.player.play();
    }
    if (vibrate) this.startVibration();
  }

  get playing() {
    return this.player?.playing ?? false;
  }

  async stop() {
    this.stopVibration();
    if (this.player) {
      try {
        this.player.pause();
        this.player.remove();
      } catch {}
      this.player = null;
    }
  }

  private startVibration() {
    if (this.vibrating) return;
    this.vibrating = true;
    Vibration.vibrate([500, 800, 500, 800], true);
  }

  private stopVibration() {
    if (!this.vibrating) return;
    this.vibrating = false;
    Vibration.cancel();
  }
}

export const alarmPlayer = new AlarmPlayer();
