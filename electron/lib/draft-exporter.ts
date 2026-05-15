import { BrowserWindow, dialog } from 'electron';
import { writeFile } from 'node:fs/promises';
import { marked } from 'marked';
import type { DraftMeta } from '../../src/types/qwill';
import { markdownToPlainText } from './export-content';

export type ExportFormat = 'markdown' | 'txt' | 'pdf';

interface ExportDraftInput {
  meta: DraftMeta;
  body: string;
  format: ExportFormat;
  owner?: BrowserWindow | null;
}

interface ExportDefinition {
  extension: string;
  filters: Electron.FileFilter[];
}

const EXPORT_DEFINITIONS: Record<ExportFormat, ExportDefinition> = {
  markdown: {
    extension: 'md',
    filters: [{ name: 'Markdown', extensions: ['md'] }]
  },
  txt: {
    extension: 'txt',
    filters: [{ name: 'Plain Text', extensions: ['txt'] }]
  },
  pdf: {
    extension: 'pdf',
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  }
};

export async function exportDraft(input: ExportDraftInput): Promise<string | null> {
  const definition = EXPORT_DEFINITIONS[input.format];
  const destination = await chooseExportDestination(input.meta, definition, input.owner);
  if (!destination) {
    return null;
  }

  const markdown = input.body;

  if (input.format === 'markdown') {
    await writeFile(destination, markdown, 'utf8');
    return destination;
  }

  if (input.format === 'txt') {
    await writeFile(destination, markdownToPlainText(markdown), 'utf8');
    return destination;
  }

  const pdf = await renderMarkdownPdf(input.meta, markdown);
  await writeFile(destination, pdf);

  return destination;
}

async function chooseExportDestination(
  meta: DraftMeta,
  definition: ExportDefinition,
  owner?: BrowserWindow | null
): Promise<string | null> {
  const options: Electron.SaveDialogOptions = {
    title: `Export ${meta.title}`,
    defaultPath: `${sanitizeFileName(meta.title)}.${definition.extension}`,
    filters: definition.filters,
    properties: ['createDirectory', 'showOverwriteConfirmation']
  };

  const result = owner ? await dialog.showSaveDialog(owner, options) : await dialog.showSaveDialog(options);

  return result.canceled ? null : result.filePath ?? null;
}

async function renderMarkdownPdf(meta: DraftMeta, markdown: string): Promise<Buffer> {
  const window = new BrowserWindow({
    width: 794,
    height: 1123,
    show: false,
    webPreferences: {
      sandbox: true,
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  try {
    await window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(createPrintHtml(meta, markdown))}`);

    return await window.webContents.printToPDF({
      printBackground: true,
      margins: {
        marginType: 'custom',
        top: 0.6,
        bottom: 0.6,
        left: 0.7,
        right: 0.7
      },
      pageSize: 'A4'
    });
  } finally {
    window.close();
  }
}

function createPrintHtml(meta: DraftMeta, markdown: string): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(meta.title)}</title>
    <style>
      @page { size: A4; margin: 0; }
      html, body { margin: 0; padding: 0; background: #ffffff; color: #1a1a1a; }
      body {
        font-family: Georgia, "Times New Roman", serif;
        font-size: 12pt;
        line-height: 1.62;
      }
      main { max-width: 34rem; margin: 0 auto; padding: 0; }
      h1, h2, h3 { line-height: 1.25; margin: 1.6em 0 0.55em; }
      h1 { font-size: 22pt; }
      h2 { font-size: 17pt; }
      h3 { font-size: 14pt; }
      p { margin: 0 0 1em; }
      blockquote {
        margin: 1em 0;
        padding-left: 1em;
        border-left: 2px solid #999999;
        color: #444444;
      }
      hr { border: 0; border-top: 1px solid #dddddd; margin: 2em 0; }
      code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.9em; }
      pre { white-space: pre-wrap; padding: 0.8em; background: #f5f5f5; }
    </style>
  </head>
  <body>
    <main>${marked.parse(markdown)}</main>
  </body>
</html>`;
}

function sanitizeFileName(fileName: string): string {
  const sanitized = fileName.trim().replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-').replace(/\s+/g, ' ');
  return sanitized.length > 0 ? sanitized.slice(0, 120) : 'Untitled';
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return character;
    }
  });
}
