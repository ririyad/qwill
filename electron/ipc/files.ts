import { ipcMain } from 'electron';
import type { DraftMeta } from '../../src/types/qwill';

const notImplemented = (): never => {
  throw new Error('File I/O will be implemented in Sprint 2.');
};

export function registerFilesIpc(): void {
  ipcMain.handle('files:list', (): DraftMeta[] => []);
  ipcMain.handle('files:read', notImplemented);
  ipcMain.handle('files:write', notImplemented);
  ipcMain.handle('files:create', notImplemented);
  ipcMain.handle('files:delete', notImplemented);
  ipcMain.handle('files:rename', notImplemented);
  ipcMain.handle('files:exportPDF', notImplemented);
  ipcMain.handle('files:exportTxt', notImplemented);
}
