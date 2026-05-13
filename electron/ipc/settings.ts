import { ipcMain } from 'electron';
import { defaultSettings } from '../../src/lib/default-settings';
import type { Settings } from '../../src/types/qwill';

let settings: Settings = { ...defaultSettings };

export function registerSettingsIpc(): void {
  ipcMain.handle('settings:get', () => settings);
  ipcMain.handle('settings:set', (_event, patch: Partial<Settings>) => {
    settings = { ...settings, ...patch };
    return settings;
  });
}
