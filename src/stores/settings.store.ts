import { writable } from 'svelte/store';
import { defaultSettings } from '../lib/default-settings';
import type { Settings, WritingStats } from '../types/qwill';

export const settings = writable<Settings>({ ...defaultSettings });
export const writingStats = writable<WritingStats>({
  dates: [],
  currentStreak: 0,
  wroteToday: false
});

export async function loadSettings(): Promise<void> {
  if (!window.qwill) return;

  settings.set(await window.qwill.settings.get());
  writingStats.set(await window.qwill.settings.getWritingStats());
}

export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  settings.update((current) => ({ ...current, ...patch }));

  if (!window.qwill) return;

  settings.set(await window.qwill.settings.set(patch));
}

export function watchSettings(): () => void {
  if (!canUseQwillApi()) {
    return () => undefined;
  }

  const unwatchSettings = window.qwill.on('settings:changed', (nextSettings) => {
    settings.set(nextSettings as Settings);
  });

  const unwatchWritingStats = window.qwill.on('writingStats:changed', (nextWritingStats) => {
    writingStats.set(nextWritingStats as WritingStats);
  });

  return () => {
    unwatchWritingStats();
    unwatchSettings();
  };
}

function canUseQwillApi(): boolean {
  return typeof window !== 'undefined' && Boolean(window.qwill);
}
