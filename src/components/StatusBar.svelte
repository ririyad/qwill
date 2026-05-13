<script lang="ts">
  import { readingTime, wordCount } from '../stores/editor.store';
</script>

<footer class="status-bar">
  <span>{$wordCount} words</span>
  <span>{$readingTime} min read</span>
  <span class="status-spacer"></span>
  <span>Saved locally</span>
</footer>
