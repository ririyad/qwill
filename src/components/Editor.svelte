<script lang="ts">
  import { content } from '../stores/editor.store';
</script>

<div class="editor-column">
  <textarea
    class="editor-surface"
    aria-label="Draft editor"
    placeholder="# Untitled&#10;&#10;Start writing..."
    bind:value={$content}
    spellcheck="true"
  ></textarea>
</div>
