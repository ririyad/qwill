import { ipcMain, shell } from 'electron';
import { getDraftsPath } from '../lib/paths';

export function registerShellIpc(): void {
  ipcMain.handle('shell:openDraftsFolder', async () => {
    await shell.openPath(getDraftsPath());
  });
}
