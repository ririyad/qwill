import { derived, writable } from 'svelte/store';
import type { DraftMeta } from '../types/qwill';

export const drafts = writable<DraftMeta[]>([]);
export const draftSearch = writable('');

export const filteredDrafts = derived([drafts, draftSearch], ([$drafts, $draftSearch]) => {
  const query = $draftSearch.trim().toLowerCase();
  if (!query) return $drafts;

  return $drafts.filter((draft) => draft.title.toLowerCase().includes(query));
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

function canUseQwillApi(): boolean {
  return typeof window !== 'undefined' && Boolean(window.qwill);
}
