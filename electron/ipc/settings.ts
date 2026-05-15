import { ipcMain } from 'electron';
import type { SettingsStore } from '../lib/settings-store';
import type { Settings } from '../../src/types/qwill';

export function registerSettingsIpc(settingsStore: SettingsStore): void {
  ipcMain.handle('settings:get', () => settingsStore.getSettings());
  ipcMain.handle('settings:set', (_event, patch: Partial<Settings>) => {
    return settingsStore.setSettings(patch);
  });
  ipcMain.handle('settings:getWritingStats', () => settingsStore.getWritingStats());
}
