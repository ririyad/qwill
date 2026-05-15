import { contextBridge, ipcRenderer } from 'electron';
import type { QwillApi, Settings } from '../src/types/qwill';

const allowedEvents = new Set<string>(['drafts:changed', 'settings:changed', 'writingStats:changed']);

const api: QwillApi = {
  files: {
    list: () => ipcRenderer.invoke('files:list'),
    read: (id: string) => ipcRenderer.invoke('files:read', id),
    write: (id: string, content: string) => ipcRenderer.invoke('files:write', id, content),
    create: (title: string) => ipcRenderer.invoke('files:create', title),
    delete: (id: string) => ipcRenderer.invoke('files:delete', id),
    rename: (id: string, title: string) => ipcRenderer.invoke('files:rename', id, title),
    exportMarkdown: (id: string) => ipcRenderer.invoke('files:exportMarkdown', id),
    exportPDF: (id: string) => ipcRenderer.invoke('files:exportPDF', id),
    exportTxt: (id: string) => ipcRenderer.invoke('files:exportTxt', id)
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    set: (patch: Partial<Settings>) => ipcRenderer.invoke('settings:set', patch),
    getWritingStats: () => ipcRenderer.invoke('settings:getWritingStats')
  },
  shell: {
    openDraftsFolder: () => ipcRenderer.invoke('shell:openDraftsFolder')
  },
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    toggleMaximize: () => ipcRenderer.invoke('window:toggleMaximize'),
    close: () => ipcRenderer.invoke('window:close')
  },
  on: (channel: string, callback: (...args: unknown[]) => void) => {
    if (!allowedEvents.has(channel)) {
      throw new Error(`Unsupported qwill event channel: ${channel}`);
    }

    const listener = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => callback(...args);
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  }
};

contextBridge.exposeInMainWorld('qwill', api);
