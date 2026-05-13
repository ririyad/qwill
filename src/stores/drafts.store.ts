import { derived, writable } from 'svelte/store';
import type { DraftMeta } from '../types/qwill';

export const drafts = writable<DraftMeta[]>([]);
export const draftSearch = writable('');

export const filteredDrafts = derived([drafts, draftSearch], ([$drafts, $draftSearch]) => {
  const query = $draftSearch.trim().toLowerCase();
  if (!query) return $drafts;

  return $drafts.filter((draft) => draft.title.toLowerCase().includes(query));
});
