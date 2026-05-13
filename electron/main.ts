import { app, BrowserWindow } from 'electron';
import { join } from 'node:path';
import { registerFilesIpc } from './ipc/files';
import { registerSettingsIpc } from './ipc/settings';
import { registerShellIpc } from './ipc/shell';
import { registerWindowIpc } from './ipc/window';
import { DraftRepository } from './lib/draft-repository';
import { getDraftsPath } from './lib/paths';

let mainWindow: BrowserWindow | null = null;

const hasSingleInstanceLock = app.requestSingleInstanceLock();

if (!hasSingleInstanceLock) {
  app.quit();
}

function isAllowedRendererNavigation(targetUrl: string): boolean {
  if (!process.env.ELECTRON_RENDERER_URL) {
    return targetUrl.startsWith('file://');
  }

  try {
    return new URL(targetUrl).origin === new URL(process.env.ELECTRON_RENDERER_URL).origin;
  } catch {
    return false;
  }
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1120,
    height: 780,
    minWidth: 760,
    minHeight: 520,
    frame: false,
    show: false,
    title: 'qwill',
    backgroundColor: '#FAFAF8',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false
    }
  });

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event, targetUrl) => {
    if (!isAllowedRendererNavigation(targetUrl)) {
      event.preventDefault();
    }
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

if (hasSingleInstanceLock) {
  app.whenReady().then(async () => {
    app.setName('qwill');

    const draftRepository = new DraftRepository(getDraftsPath());
    await draftRepository.initialize();

    registerFilesIpc(draftRepository);
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
}

app.on('second-instance', () => {
  if (!mainWindow) return;

  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }

  mainWindow.focus();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
