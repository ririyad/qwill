import { app, BrowserWindow } from 'electron';
import { join } from 'node:path';
import { registerFilesIpc } from './ipc/files';
import { registerSettingsIpc } from './ipc/settings';
import { registerShellIpc } from './ipc/shell';
import { registerWindowIpc } from './ipc/window';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1120,
    height: 780,
    minWidth: 760,
    minHeight: 520,
    frame: false,
    title: 'qwill',
    backgroundColor: '#FAFAF8',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  registerFilesIpc();
  registerSettingsIpc();
  registerShellIpc();
  registerWindowIpc();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
