export type Theme = 'light' | 'dark' | 'sepia';
export type FontFamily = 'lora' | 'ia-writer-quattro' | 'merriweather' | 'georgia' | 'system';
export type AmbientSound = 'none' | 'rain' | 'cafe' | 'white-noise';

export interface Settings {
  theme: Theme;
  font: FontFamily;
  fontSize: number;
  lineHeight: number;
  maxLineWidth: number;
  typewriterMode: boolean;
  ambientSound: AmbientSound;
  ambientVolume: number;
  showWordCount: boolean;
  showSessionTimer: boolean;
  showStreak: boolean;
  focusModeDefault: boolean;
}

export interface WritingStats {
  dates: string[];
  currentStreak: number;
  wroteToday: boolean;
}

export interface DraftMeta {
  id: string;
  title: string;
  created: string;
  modified: string;
  tags: string[];
  wordCount: number;
  preview: string;
}

export interface FileApi {
  list: () => Promise<DraftMeta[]>;
  read: (id: string) => Promise<string>;
  write: (id: string, content: string) => Promise<void>;
  create: (title: string) => Promise<DraftMeta>;
  delete: (id: string) => Promise<void>;
  rename: (id: string, title: string) => Promise<DraftMeta>;
  exportPDF: (id: string) => Promise<void>;
  exportTxt: (id: string) => Promise<void>;
}

export interface SettingsApi {
  get: () => Promise<Settings>;
  set: (patch: Partial<Settings>) => Promise<Settings>;
  getWritingStats: () => Promise<WritingStats>;
}

export interface ShellApi {
  openDraftsFolder: () => Promise<void>;
}

export interface WindowApi {
  minimize: () => Promise<void>;
  toggleMaximize: () => Promise<void>;
  close: () => Promise<void>;
}

export interface QwillApi {
  files: FileApi;
  settings: SettingsApi;
  shell: ShellApi;
  window: WindowApi;
  on: (channel: string, callback: (...args: unknown[]) => void) => () => void;
}
