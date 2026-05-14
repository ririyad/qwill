<script lang="ts">
  import { isDirty, isSaving, readingTime, wordCount } from '../stores/editor.store';
</script>

<footer class="status-bar">
  <span>{$wordCount} words</span>
  <span>{$readingTime} min read</span>
  <span class="status-spacer"></span>
  <span>{#if $isSaving}Saving...{:else if $isDirty}Unsaved{:else}Saved locally{/if}</span>
</footer>
