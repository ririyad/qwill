import { app, ipcMain, shell } from 'electron';
import { join } from 'node:path';

export function getDraftsPath(): string {
  return join(app.getPath('userData'), 'drafts');
}

export function registerShellIpc(): void {
  ipcMain.handle('shell:openDraftsFolder', async () => {
    await shell.openPath(getDraftsPath());
  });
}
