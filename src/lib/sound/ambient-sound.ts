import { Howl } from 'howler';
import { writable } from 'svelte/store';
import type { AmbientSound, Settings } from '../../types/qwill';

type PlayableAmbientSound = Exclude<AmbientSound, 'none'>;

const soundSources: Record<PlayableAmbientSound, string> = {
  rain: '/sounds/rain.mp3',
  cafe: '/sounds/cafe.mp3',
  'white-noise': '/sounds/white-noise.mp3'
};

export const ambientSoundPlaying = writable(false);
export const ambientSoundError = writable<string | null>(null);

let activeHowl: Howl | null = null;
let activeSound: PlayableAmbientSound | null = null;
let userEnabledPlayback = false;

export function startAmbientSound(settings: Pick<Settings, 'ambientSound' | 'ambientVolume'>): boolean {
  userEnabledPlayback = true;

  const sound = toPlayableSound(settings.ambientSound);
  if (!sound) {
    ambientSoundPlaying.set(false);
    ambientSoundError.set('Choose an ambient sound first.');
    return false;
  }

  playAmbientSound(sound, settings.ambientVolume);
  return true;
}

export function stopAmbientSound(): void {
  userEnabledPlayback = false;
  stopActiveSound();
  ambientSoundError.set(null);
}

export function syncAmbientSound(settings: Pick<Settings, 'ambientSound' | 'ambientVolume'>): void {
  if (!userEnabledPlayback) {
    return;
  }

  const sound = toPlayableSound(settings.ambientSound);
  if (!sound) {
    stopAmbientSound();
    return;
  }

  if (activeSound !== sound || !activeHowl) {
    playAmbientSound(sound, settings.ambientVolume);
    return;
  }

  activeHowl.volume(settings.ambientVolume);
}

function playAmbientSound(sound: PlayableAmbientSound, volume: number): void {
  ambientSoundError.set(null);

  if (activeHowl && activeSound === sound) {
    activeHowl.volume(volume);

    if (!activeHowl.playing()) {
      activeHowl.play();
    }

    ambientSoundPlaying.set(true);
    return;
  }

  stopActiveSound();
  activeSound = sound;
  activeHowl = new Howl({
    src: [soundSources[sound]],
    loop: true,
    volume,
    onloaderror: () => handleSoundError(),
    onplayerror: (_soundId, error) => {
      handleSoundError(error);
    }
  });

  activeHowl.play();
  ambientSoundPlaying.set(true);
}

function stopActiveSound(): void {
  if (activeHowl) {
    activeHowl.stop();
    activeHowl.unload();
  }

  activeHowl = null;
  activeSound = null;
  ambientSoundPlaying.set(false);
}

function handleSoundError(error?: unknown): void {
  stopActiveSound();
  ambientSoundError.set(error instanceof Error ? error.message : 'Ambient sound failed to play.');
}

function toPlayableSound(sound: AmbientSound): PlayableAmbientSound | null {
  return sound === 'none' ? null : sound;
}
