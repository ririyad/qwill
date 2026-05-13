import { derived, writable } from 'svelte/store';
import { countWords, estimateReadingTime } from '../lib/stats';

export const activeDraftId = writable<string | null>(null);
export const content = writable('');
export const isDirty = writable(false);
export const isSaving = writable(false);

export const wordCount = derived(content, ($content) => countWords($content));
export const readingTime = derived(wordCount, ($wordCount) => estimateReadingTime($wordCount));
