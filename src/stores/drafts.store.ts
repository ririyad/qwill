import { derived, get, writable } from 'svelte/store';
import { activeDraftId, isDirty, openDraft, replaceEditorContent, saveActiveDraft } from './editor.store';
import type { DraftMeta } from '../types/qwill';

export const drafts = writable<DraftMeta[]>([]);
export const draftSearch = writable('');
export const isDraftActionPending = writable(false);

export const filteredDrafts = derived([drafts, draftSearch], ([$drafts, $draftSearch]) => {
  const query = $draftSearch.trim().toLowerCase();
  if (!query) return $drafts;

  return $drafts.filter((draft) => draft.title.toLowerCase().includes(query));
});

export const activeDraft = derived([drafts, activeDraftId], ([$drafts, $activeDraftId]) => {
  if (!$activeDraftId) return null;

  return $drafts.find((draft) => draft.id === $activeDraftId) ?? null;
});

export async function loadDrafts(): Promise<void> {
  if (!canUseQwillApi()) return;

  drafts.set(await window.qwill.files.list());
}

export function watchDrafts(): () => void {
  if (!canUseQwillApi()) {
    return () => undefined;
  }

  return window.qwill.on('drafts:changed', (nextDrafts) => {
    if (Array.isArray(nextDrafts)) {
      drafts.set(nextDrafts as DraftMeta[]);
    }
  });
}

export async function createDraftAndOpen(): Promise<DraftMeta | null> {
  if (!canUseQwillApi() || get(isDraftActionPending)) return null;

  return runDraftAction(async () => {
    await saveActiveDraft();

    const draft = await window.qwill.files.create('Untitled');
    upsertDraft(draft);
    draftSearch.set('');
    replaceEditorContent('', draft.id);

    return draft;
  });
}

export async function openDraftById(draftId: string): Promise<void> {
  if (!canUseQwillApi() || get(isDraftActionPending) || get(activeDraftId) === draftId) return;

  await runDraftAction(async () => {
    await openDraft(draftId);
  });
}

export async function renameDraft(draftId: string, title: string): Promise<DraftMeta | null> {
  if (!canUseQwillApi() || get(isDraftActionPending)) return null;

  return runDraftAction(async () => {
    const normalizedTitle = title.trim() || 'Untitled';

    if (get(activeDraftId) === draftId && get(isDirty)) {
      await saveActiveDraft();
    }

    const draft = await window.qwill.files.rename(draftId, normalizedTitle);
    upsertDraft(draft);

    return draft;
  });
}

export async function deleteDraft(draftId: string): Promise<void> {
  if (!canUseQwillApi() || get(isDraftActionPending)) return;

  await runDraftAction(async () => {
    await window.qwill.files.delete(draftId);

    drafts.update((currentDrafts) => currentDrafts.filter((draft) => draft.id !== draftId));

    if (get(activeDraftId) === draftId) {
      replaceEditorContent('', null);
    }
  });
}

function canUseQwillApi(): boolean {
  return typeof window !== 'undefined' && Boolean(window.qwill);
}

async function runDraftAction<TResult>(action: () => Promise<TResult>): Promise<TResult> {
  isDraftActionPending.set(true);

  try {
    return await action();
  } finally {
    isDraftActionPending.set(false);
  }
}

function upsertDraft(draft: DraftMeta): void {
  drafts.update((currentDrafts) => {
    const nextDrafts = currentDrafts.filter((currentDraft) => currentDraft.id !== draft.id);
    nextDrafts.push(draft);

    return nextDrafts.sort((a, b) => b.modified.localeCompare(a.modified));
  });
}
