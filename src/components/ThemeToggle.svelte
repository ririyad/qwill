<script lang="ts">
  import { settings, updateSettings } from '../stores/settings.store';
  import type { Theme } from '../types/qwill';

  const themes: Theme[] = ['light', 'dark', 'sepia'];

  const nextTheme = () => {
    const index = themes.indexOf($settings.theme);
    const theme = themes[(index + 1) % themes.length];
    updateSettings({ theme });
  };
</script>

<button class="theme-toggle" type="button" onclick={nextTheme}>
  {$settings.theme}
</button>
