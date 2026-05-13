<script lang="ts">
  import { drafts } from '../stores/drafts.store';

  interface Props {
    onclose: () => void;
  }

  let { onclose }: Props = $props();
</script>

<div class="draft-panel-header">
  <h2>Drafts</h2>
  <button class="icon-button" type="button" aria-label="Close drafts" onclick={onclose}>
    <span class="chrome-icon chrome-icon-close" aria-hidden="true"></span>
  </button>
</div>

<label class="search-field">
  <span class="visually-hidden">Search drafts</span>
  <input type="search" placeholder="Search" />
</label>

<div class="draft-list">
  {#if $drafts.length === 0}
    <p class="empty-state">No drafts yet.</p>
  {:else}
    {#each $drafts as draft}
      <button class="draft-list-item" type="button">
        <span>{draft.title}</span>
        <small>{draft.wordCount}w</small>
      </button>
    {/each}
  {/if}
</div>

<button class="new-draft-button" type="button">+ New Draft</button>
