import { BrowserWindow } from 'electron';
import Store from 'electron-store';
import { defaultSettings } from '../../src/lib/default-settings';
import type { Settings, WritingStats } from '../../src/types/qwill';

interface QwillStore {
  settings: Settings;
  writingDates: string[];
}

const store = new Store<QwillStore>({
  name: 'qwill-settings',
  defaults: {
    settings: defaultSettings,
    writingDates: []
  }
});

export class SettingsStore {
  getSettings(): Settings {
    return sanitizeSettings(store.get('settings'));
  }

  setSettings(patch: Partial<Settings>): Settings {
    const settings = sanitizeSettings({ ...this.getSettings(), ...patch });
    store.set('settings', settings);
    this.notifySettingsChanged(settings);

    return settings;
  }

  getWritingStats(): WritingStats {
    const dates = normalizeDateList(store.get('writingDates'));
    const today = getLocalDateKey();

    return {
      dates,
      currentStreak: calculateCurrentStreak(dates, today),
      wroteToday: dates.includes(today)
    };
  }

  recordWritingDay(): WritingStats {
    const today = getLocalDateKey();
    const dates = normalizeDateList(store.get('writingDates'));

    if (!dates.includes(today)) {
      dates.push(today);
      store.set('writingDates', dates.sort());
    }

    const stats = this.getWritingStats();
    this.notifyWritingStatsChanged(stats);

    return stats;
  }

  private notifySettingsChanged(settings: Settings): void {
    for (const window of BrowserWindow.getAllWindows()) {
      window.webContents.send('settings:changed', settings);
    }
  }

  private notifyWritingStatsChanged(stats: WritingStats): void {
    for (const window of BrowserWindow.getAllWindows()) {
      window.webContents.send('writingStats:changed', stats);
    }
  }
}

function sanitizeSettings(value: Partial<Settings>): Settings {
  return {
    theme: isOneOf(value.theme, ['light', 'dark', 'sepia']) ? value.theme : defaultSettings.theme,
    font: isOneOf(value.font, ['lora', 'ia-writer-quattro', 'merriweather', 'georgia', 'system'])
      ? value.font
      : defaultSettings.font,
    fontSize: clampNumber(value.fontSize, 14, 22, defaultSettings.fontSize),
    lineHeight: clampNumber(value.lineHeight, 1.5, 2.2, defaultSettings.lineHeight),
    maxLineWidth: clampNumber(value.maxLineWidth, 560, 800, defaultSettings.maxLineWidth),
    typewriterMode: value.typewriterMode ?? defaultSettings.typewriterMode,
    ambientSound: isOneOf(value.ambientSound, ['none', 'rain', 'cafe', 'white-noise'])
      ? value.ambientSound
      : defaultSettings.ambientSound,
    ambientVolume: clampNumber(value.ambientVolume, 0, 1, defaultSettings.ambientVolume),
    showWordCount: value.showWordCount ?? defaultSettings.showWordCount,
    showSessionTimer: value.showSessionTimer ?? defaultSettings.showSessionTimer,
    showStreak: value.showStreak ?? defaultSettings.showStreak,
    focusModeDefault: value.focusModeDefault ?? defaultSettings.focusModeDefault
  };
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

function isOneOf<TValue extends string>(value: unknown, values: readonly TValue[]): value is TValue {
  return typeof value === 'string' && values.includes(value as TValue);
}

function normalizeDateList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.filter((date): date is string => /^\d{4}-\d{2}-\d{2}$/.test(date)))].sort();
}

function calculateCurrentStreak(dates: string[], today: string): number {
  const dateSet = new Set(dates);
  let cursor = parseLocalDateKey(today);
  let streak = 0;

  while (dateSet.has(toLocalDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function getLocalDateKey(): string {
  return toLocalDateKey(new Date());
}

function parseLocalDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  return `${year}-${month}-${day}`;
}
