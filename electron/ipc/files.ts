import { BrowserWindow, ipcMain } from 'electron';
import { DraftRepository } from '../lib/draft-repository';
import { exportDraft, type ExportFormat } from '../lib/draft-exporter';
import type { DraftMeta, ExportResult } from '../../src/types/qwill';

interface FilesIpcOptions {
  onDraftWritten?: () => void;
}

export function registerFilesIpc(repository: DraftRepository, options: FilesIpcOptions = {}): void {
  ipcMain.handle('files:list', (): DraftMeta[] => repository.list());

  ipcMain.handle('files:read', (_event, id: unknown): Promise<string> => repository.read(requireString(id, 'id')));

  ipcMain.handle('files:write', async (_event, id: unknown, content: unknown): Promise<void> => {
    await repository.write(requireString(id, 'id'), requireString(content, 'content'));
    options.onDraftWritten?.();
    notifyDraftsChanged(repository);
  });

  ipcMain.handle('files:create', async (_event, title: unknown): Promise<DraftMeta> => {
    const draft = await repository.create(requireString(title, 'title'));
    notifyDraftsChanged(repository);
    return draft;
  });

  ipcMain.handle('files:delete', async (_event, id: unknown): Promise<void> => {
    await repository.delete(requireString(id, 'id'));
    notifyDraftsChanged(repository);
  });

  ipcMain.handle('files:rename', async (_event, id: unknown, title: unknown): Promise<DraftMeta> => {
    const draft = await repository.rename(requireString(id, 'id'), requireString(title, 'title'));
    notifyDraftsChanged(repository);
    return draft;
  });

  ipcMain.handle('files:exportMarkdown', (event, id: unknown): Promise<ExportResult> => {
    return exportDraftById(repository, requireString(id, 'id'), 'markdown', BrowserWindow.fromWebContents(event.sender));
  });

  ipcMain.handle('files:exportPDF', (event, id: unknown): Promise<ExportResult> => {
    return exportDraftById(repository, requireString(id, 'id'), 'pdf', BrowserWindow.fromWebContents(event.sender));
  });

  ipcMain.handle('files:exportTxt', (event, id: unknown): Promise<ExportResult> => {
    return exportDraftById(repository, requireString(id, 'id'), 'txt', BrowserWindow.fromWebContents(event.sender));
  });
}

function notifyDraftsChanged(repository: DraftRepository): void {
  const drafts = repository.list();

  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send('drafts:changed', drafts);
  }
}

function requireString(value: unknown, name: string): string {
  if (typeof value !== 'string') {
    throw new Error(`Invalid files IPC argument: ${name} must be a string.`);
  }

  return value;
}

async function exportDraftById(
  repository: DraftRepository,
  id: string,
  format: ExportFormat,
  owner: BrowserWindow | null
): Promise<ExportResult> {
  const [meta, body] = await Promise.all([repository.getMeta(id), repository.read(id)]);
  const path = await exportDraft({ meta, body, format, owner });

  return {
    canceled: path === null,
    path
  };
}
