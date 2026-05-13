import { mkdir, open, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { basename, isAbsolute, join, relative, resolve } from 'node:path';
import { ulid } from 'ulid';
import type { DraftMeta } from '../../src/types/qwill';
import {
  isValidDraftId,
  normalizeDraftTitle,
  parseDraftMarkdown,
  parseDraftMeta,
  serializeDraftMarkdown,
  withUpdatedDraftBody,
  withUpdatedDraftTitle
} from './draft-file';

const FRONT_MATTER_READ_CHUNK_SIZE = 4096;
const FRONT_MATTER_READ_LIMIT = 64 * 1024;

export class DraftRepository {
  private readonly index = new Map<string, DraftMeta>();
  private readonly draftsPath: string;

  constructor(draftsPath: string) {
    this.draftsPath = draftsPath;
  }

  async initialize(): Promise<void> {
    await mkdir(this.draftsPath, { recursive: true });
    await this.rebuildIndex();
  }

  list(): DraftMeta[] {
    return [...this.index.values()].sort((a, b) => b.modified.localeCompare(a.modified));
  }

  async read(id: string): Promise<string> {
    const draftId = this.requireDraftId(id);
    const markdown = await readFile(this.getDraftPath(draftId), 'utf8');
    const parsed = parseDraftMarkdown(markdown, draftId);

    this.index.set(draftId, parsed.meta);
    return parsed.body;
  }

  async write(id: string, body: string): Promise<void> {
    const draftId = this.requireDraftId(id);
    const existing = this.index.get(draftId) ?? (await this.readMeta(draftId));
    const meta = withUpdatedDraftBody(existing, body);

    await this.writeDraftFile(meta, body);
    this.index.set(draftId, meta);
  }

  async create(title: string): Promise<DraftMeta> {
    const now = new Date().toISOString();
    const meta: DraftMeta = {
      id: ulid(),
      title: normalizeDraftTitle(title),
      created: now,
      modified: now,
      tags: [],
      wordCount: 0,
      preview: ''
    };

    await this.writeDraftFile(meta, '');
    this.index.set(meta.id, meta);

    return meta;
  }

  async delete(id: string): Promise<void> {
    const draftId = this.requireDraftId(id);

    await rm(this.getDraftPath(draftId), { force: true });
    this.index.delete(draftId);
  }

  async rename(id: string, title: string): Promise<DraftMeta> {
    const draftId = this.requireDraftId(id);
    const body = await this.read(draftId);
    const existing = this.index.get(draftId) ?? (await this.readMeta(draftId));
    const meta = withUpdatedDraftTitle(existing, title);
    const refreshedMeta = {
      ...meta,
      wordCount: existing.wordCount,
      preview: existing.preview
    };

    await this.writeDraftFile(refreshedMeta, body);
    this.index.set(draftId, refreshedMeta);

    return refreshedMeta;
  }

  private async rebuildIndex(): Promise<void> {
    this.index.clear();

    const entries = await readdir(this.draftsPath, { withFileTypes: true });
    const draftFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.md'));

    await Promise.all(
      draftFiles.map(async (entry) => {
        const fallbackId = basename(entry.name, '.md');
        if (!isValidDraftId(fallbackId)) {
          return;
        }

        const frontMatter = await this.readFrontMatter(this.getDraftPath(fallbackId));
        const meta = parseDraftMeta(frontMatter, fallbackId);
        if (isValidDraftId(meta.id) && meta.id === fallbackId) {
          this.index.set(meta.id, meta);
        }
      })
    );
  }

  private async readMeta(id: string): Promise<DraftMeta> {
    const draftId = this.requireDraftId(id);
    const frontMatter = await this.readFrontMatter(this.getDraftPath(draftId));
    const meta = parseDraftMeta(frontMatter, draftId);

    this.index.set(draftId, meta);
    return meta;
  }

  private async readFrontMatter(filePath: string): Promise<string> {
    const file = await open(filePath, 'r');
    const buffer = Buffer.alloc(FRONT_MATTER_READ_CHUNK_SIZE);
    let offset = 0;
    let content = '';

    try {
      while (offset < FRONT_MATTER_READ_LIMIT) {
        const { bytesRead } = await file.read(buffer, 0, buffer.length, offset);
        if (bytesRead === 0) {
          break;
        }

        content += buffer.toString('utf8', 0, bytesRead);
        offset += bytesRead;

        const normalized = content.replace(/\r\n/g, '\n');
        const end = normalized.indexOf('\n---', 4);
        if (end !== -1) {
          return normalized.slice(0, end + '\n---'.length);
        }
      }

      return content;
    } finally {
      await file.close();
    }
  }

  private async writeDraftFile(meta: DraftMeta, body: string): Promise<void> {
    const draftPath = this.getDraftPath(meta.id);
    await writeFile(draftPath, serializeDraftMarkdown(meta, body), 'utf8');
  }

  private requireDraftId(id: string): string {
    if (!isValidDraftId(id)) {
      throw new Error(`Invalid draft id: ${id}`);
    }

    return id;
  }

  private getDraftPath(id: string): string {
    const draftPath = resolve(this.draftsPath, `${id}.md`);
    const draftsRoot = resolve(this.draftsPath);
    const relativeDraftPath = relative(draftsRoot, draftPath);

    if (relativeDraftPath.startsWith('..') || isAbsolute(relativeDraftPath)) {
      throw new Error(`Draft path escaped drafts directory: ${id}`);
    }

    return draftPath;
  }
}
