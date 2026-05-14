<script lang="ts">
  import { activeDraftId } from '../stores/editor.store';
  import {
    createDraftAndOpen,
    deleteDraft,
    draftSearch,
    drafts,
    filteredDrafts,
    isDraftActionPending,
    openDraftById,
    renameDraft
  } from '../stores/drafts.store';
  import type { DraftMeta } from '../types/qwill';

  interface Props {
    onclose: () => void;
  }

  let { onclose }: Props = $props();

  let editingDraftId = $state<string | null>(null);
  let editingTitle = $state('');

  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short'
  });

  const handleCreateDraft = async () => {
    const draft = await createDraftAndOpen();

    if (draft) {
      onclose();
    }
  };

  const handleOpenDraft = async (draftId: string) => {
    await openDraftById(draftId);
    onclose();
  };

  const startRename = (draft: DraftMeta) => {
    editingDraftId = draft.id;
    editingTitle = draft.title;
  };

  const cancelRename = () => {
    editingDraftId = null;
    editingTitle = '';
  };

  const submitRename = async (event: SubmitEvent) => {
    event.preventDefault();

    if (!editingDraftId) return;

    await renameDraft(editingDraftId, editingTitle);
    cancelRename();
  };

  const handleRenameKeydown = (event: KeyboardEvent) => {
    event.stopPropagation();

    if (event.key === 'Escape') {
      event.preventDefault();
      cancelRename();
    }
  };

  const handleDeleteDraft = async (draft: DraftMeta) => {
    const shouldDelete = window.confirm(`Delete "${draft.title}"?`);
    if (!shouldDelete) return;

    await deleteDraft(draft.id);
  };

  const formatDraftMeta = (draft: DraftMeta) => {
    const modified = new Date(draft.modified);
    const modifiedLabel = Number.isNaN(modified.getTime()) ? 'Unknown date' : dateFormatter.format(modified);

    return `${modifiedLabel} - ${draft.wordCount}w`;
  };
</script>

<div class="draft-panel-header">
  <h2>Drafts</h2>
  <button class="icon-button" type="button" aria-label="Close drafts" onclick={onclose}>
    <span class="chrome-icon chrome-icon-close" aria-hidden="true"></span>
  </button>
</div>

<label class="search-field">
  <span class="visually-hidden">Search drafts</span>
  <input type="search" placeholder="Search" bind:value={$draftSearch} />
</label>

<div class="draft-list">
  {#if $drafts.length === 0}
    <p class="empty-state">No drafts yet.</p>
  {:else if $filteredDrafts.length === 0}
    <p class="empty-state">No drafts match your search.</p>
  {:else}
    {#each $filteredDrafts as draft}
      <div class:active={$activeDraftId === draft.id} class="draft-list-row">
        {#if editingDraftId === draft.id}
          <form class="draft-rename-form" onsubmit={submitRename}>
            <input
              aria-label="Draft title"
              bind:value={editingTitle}
              disabled={$isDraftActionPending}
              onkeydown={handleRenameKeydown}
            />
            <div class="draft-actions">
              <button class="draft-action" type="submit" disabled={$isDraftActionPending}>Save</button>
              <button class="draft-action" type="button" disabled={$isDraftActionPending} onclick={cancelRename}>
                Cancel
              </button>
            </div>
          </form>
        {:else}
          <button
            class="draft-list-item"
            type="button"
            aria-current={$activeDraftId === draft.id ? 'true' : undefined}
            disabled={$isDraftActionPending}
            onclick={() => handleOpenDraft(draft.id)}
          >
            <span class="draft-title">{draft.title}</span>
            <small>{formatDraftMeta(draft)}</small>
          </button>

          <div class="draft-actions">
            <button
              class="draft-action"
              type="button"
              disabled={$isDraftActionPending}
              onclick={() => startRename(draft)}
            >
              Rename
            </button>
            <button
              class="draft-action danger"
              type="button"
              disabled={$isDraftActionPending}
              onclick={() => handleDeleteDraft(draft)}
            >
              Delete
            </button>
          </div>
        {/if}
      </div>
    {/each}
  {/if}
</div>

<button class="new-draft-button" type="button" disabled={$isDraftActionPending} onclick={handleCreateDraft}>
  + New Draft
</button>
