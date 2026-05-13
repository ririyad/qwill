import { basename } from 'node:path';
import type { DraftMeta } from '../../src/types/qwill';

interface ParsedDraft {
  meta: DraftMeta;
  body: string;
}

interface DraftMetadataInput {
  id: string;
  title: string;
  created: string;
  modified: string;
  tags?: string[];
  wordCount?: number;
  preview?: string;
}

const FRONT_MATTER_BOUNDARY = '---';
const FRONT_MATTER_END = '\n---';
const ULID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{26}$/i;

export function isValidDraftId(id: string): boolean {
  return ULID_PATTERN.test(id);
}

export function normalizeDraftTitle(title: string): string {
  const normalized = title.trim().replace(/\s+/g, ' ');
  return normalized.length > 0 ? normalized.slice(0, 160) : 'Untitled';
}

export function createDraftMeta(input: DraftMetadataInput, body: string): DraftMeta {
  const created = normalizeIsoDate(input.created);
  const modified = normalizeIsoDate(input.modified);

  return {
    id: input.id,
    title: normalizeDraftTitle(input.title),
    created,
    modified,
    tags: normalizeTags(input.tags),
    wordCount: input.wordCount ?? countWords(body),
    preview: input.preview ?? createPreview(body)
  };
}

export function parseDraftMarkdown(markdown: string, fallbackId: string): ParsedDraft {
  const parsed = splitFrontMatter(markdown);
  if (!parsed) {
    const now = new Date().toISOString();
    return {
      meta: createDraftMeta(
        {
          id: fallbackId,
          title: basename(fallbackId, '.md'),
          created: now,
          modified: now
        },
        markdown
      ),
      body: markdown
    };
  }

  const fields = parseFrontMatterFields(parsed.frontMatter);
  const id = parseString(fields.id) ?? fallbackId;
  const title = parseString(fields.title) ?? 'Untitled';
  const created = parseString(fields.created) ?? new Date().toISOString();
  const modified = parseString(fields.modified) ?? created;
  const tags = parseTags(fields.tags);
  const wordCount = parseNumber(fields.wordCount);
  const preview = parseString(fields.preview) ?? undefined;

  return {
    meta: createDraftMeta({ id, title, created, modified, tags, wordCount, preview }, parsed.body),
    body: parsed.body
  };
}

export function parseDraftMeta(frontMatterMarkdown: string, fallbackId: string): DraftMeta {
  return parseDraftMarkdown(frontMatterMarkdown, fallbackId).meta;
}

export function serializeDraftMarkdown(meta: DraftMeta, body: string): string {
  const refreshedMeta = createDraftMeta(
    {
      ...meta,
      wordCount: countWords(body),
      preview: createPreview(body)
    },
    body
  );

  const frontMatter = [
    FRONT_MATTER_BOUNDARY,
    `id: ${quoteYamlString(refreshedMeta.id)}`,
    `title: ${quoteYamlString(refreshedMeta.title)}`,
    `created: ${quoteYamlString(refreshedMeta.created)}`,
    `modified: ${quoteYamlString(refreshedMeta.modified)}`,
    `tags: ${quoteYamlStringArray(refreshedMeta.tags)}`,
    `wordCount: ${refreshedMeta.wordCount}`,
    `preview: ${quoteYamlString(refreshedMeta.preview)}`,
    FRONT_MATTER_BOUNDARY,
    ''
  ].join('\n');

  return `${frontMatter}${body}`;
}

export function withUpdatedDraftBody(meta: DraftMeta, body: string, modified = new Date()): DraftMeta {
  return createDraftMeta(
    {
      ...meta,
      modified: modified.toISOString(),
      wordCount: countWords(body),
      preview: createPreview(body)
    },
    body
  );
}

export function withUpdatedDraftTitle(meta: DraftMeta, title: string, modified = new Date()): DraftMeta {
  return createDraftMeta(
    {
      ...meta,
      title: normalizeDraftTitle(title),
      modified: modified.toISOString()
    },
    ''
  );
}

function splitFrontMatter(markdown: string): { frontMatter: string; body: string } | null {
  if (!markdown.startsWith(`${FRONT_MATTER_BOUNDARY}\n`) && !markdown.startsWith(`${FRONT_MATTER_BOUNDARY}\r\n`)) {
    return null;
  }

  const normalized = markdown.replace(/\r\n/g, '\n');
  const end = normalized.indexOf(FRONT_MATTER_END, FRONT_MATTER_BOUNDARY.length + 1);
  if (end === -1) {
    return null;
  }

  const bodyStart = end + FRONT_MATTER_END.length;
  const body = normalized.slice(bodyStart).replace(/^\n/, '');

  return {
    frontMatter: normalized.slice(FRONT_MATTER_BOUNDARY.length + 1, end),
    body
  };
}

function parseFrontMatterFields(frontMatter: string): Record<string, string> {
  return frontMatter.split('\n').reduce<Record<string, string>>((fields, line) => {
    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) {
      return fields;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (key) {
      fields[key] = value;
    }

    return fields;
  }, {});
}

function parseString(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  if (value.startsWith('"')) {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === 'string' ? parsed : null;
    } catch {
      return null;
    }
  }

  return value.replace(/^['"]|['"]$/g, '');
}

function parseNumber(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function parseTags(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return normalizeTags(Array.isArray(parsed) ? parsed : []);
  } catch {
    return normalizeTags(
      value
        .replace(/^\[|\]$/g, '')
        .split(',')
        .map((tag) => tag.trim().replace(/^['"]|['"]$/g, ''))
    );
  }
}

function normalizeIsoDate(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) {
    return [];
  }

  return [...new Set(tags.filter((tag): tag is string => typeof tag === 'string').map((tag) => tag.trim()))].filter(
    Boolean
  );
}

function countWords(markdown: string): number {
  const trimmed = markdown.trim();
  if (!trimmed) {
    return 0;
  }

  return trimmed.split(/\s+/).filter(Boolean).length;
}

function createPreview(markdown: string): string {
  return markdown.trim().replace(/\s+/g, ' ').slice(0, 120);
}

function quoteYamlString(value: string): string {
  return JSON.stringify(value);
}

function quoteYamlStringArray(values: string[]): string {
  return `[${values.map(quoteYamlString).join(', ')}]`;
}
