import { derived, get, writable } from 'svelte/store';
import { countWords, estimateReadingTime } from '../lib/stats';

export const activeDraftId = writable<string | null>(null);
export const content = writable('');
export const isDirty = writable(false);
export const isSaving = writable(false);

export const wordCount = derived(content, ($content) => countWords($content));
export const readingTime = derived(wordCount, ($wordCount) => estimateReadingTime($wordCount));

let currentSave: Promise<void> | null = null;

export function updateEditorContent(nextContent: string): void {
  content.set(nextContent);
  isDirty.set(true);
}

export function replaceEditorContent(nextContent: string, draftId: string | null): void {
  activeDraftId.set(draftId);
  content.set(nextContent);
  isDirty.set(false);
}

export async function openDraft(draftId: string): Promise<void> {
  if (get(activeDraftId) === draftId) return;

  await saveActiveDraft();

  const draftContent = await window.qwill.files.read(draftId);
  replaceEditorContent(draftContent, draftId);
}

export async function saveActiveDraft(): Promise<void> {
  if (currentSave) {
    return currentSave;
  }

  currentSave = persistActiveDraft().finally(() => {
    currentSave = null;
  });

  return currentSave;
}

async function persistActiveDraft(): Promise<void> {
  if (!window.qwill) return;

  const currentContent = get(content);
  const existingDraftId = get(activeDraftId);
  const shouldCreateDraft = !existingDraftId && currentContent.trim().length > 0;

  if (!get(isDirty) && existingDraftId) return;
  if (!existingDraftId && !shouldCreateDraft) return;

  isSaving.set(true);

  try {
    const draftId = existingDraftId ?? (await window.qwill.files.create(inferDraftTitle(currentContent))).id;
    activeDraftId.set(draftId);
    await window.qwill.files.write(draftId, currentContent);

    isDirty.set(get(content) !== currentContent);
  } finally {
    isSaving.set(false);
  }
}

function inferDraftTitle(markdown: string): string {
  const firstMeaningfulLine = markdown
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean);

  if (!firstMeaningfulLine) {
    return 'Untitled';
  }

  return firstMeaningfulLine.replace(/^#{1,6}\s+/, '').slice(0, 80);
}
