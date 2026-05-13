import { writable } from 'svelte/store';
import { defaultSettings } from '../lib/default-settings';
import type { Settings } from '../types/qwill';

export const settings = writable<Settings>({ ...defaultSettings });

export async function loadSettings(): Promise<void> {
  if (!window.qwill) return;

  settings.set(await window.qwill.settings.get());
}

export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  settings.update((current) => ({ ...current, ...patch }));

  if (!window.qwill) return;

  settings.set(await window.qwill.settings.set(patch));
}
