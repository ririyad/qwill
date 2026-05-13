import { BrowserWindow, ipcMain } from 'electron';

function getWindow(event: Electron.IpcMainInvokeEvent): BrowserWindow | null {
  return BrowserWindow.fromWebContents(event.sender);
}

export function registerWindowIpc(): void {
  ipcMain.handle('window:minimize', (event) => {
    getWindow(event)?.minimize();
  });

  ipcMain.handle('window:toggleMaximize', (event) => {
    const window = getWindow(event);
    if (!window) return;

    if (window.isMaximized()) {
      window.unmaximize();
      return;
    }

    window.maximize();
  });

  ipcMain.handle('window:close', (event) => {
    getWindow(event)?.close();
  });
}
