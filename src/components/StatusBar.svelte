<script lang="ts">
  import { isDirty, isSaving, readingTime, wordCount } from '../stores/editor.store';
  import { formattedSessionTime } from '../lib/time/session-timer';
  import { settings, writingStats } from '../stores/settings.store';
</script>

<footer class="status-bar">
  {#if $settings.showWordCount}
    <span>{$wordCount} words</span>
    <span>{$readingTime} min read</span>
  {/if}
  <span class="status-spacer"></span>
  {#if $settings.showStreak}
    <span>Streak {$writingStats.currentStreak}</span>
  {/if}
  {#if $settings.showSessionTimer}
    <span>{$formattedSessionTime}</span>
  {/if}
  <span>{#if $isSaving}Saving...{:else if $isDirty}Unsaved{:else}Saved locally{/if}</span>
</footer>
