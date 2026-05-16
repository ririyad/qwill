<script lang="ts">
  import { onMount } from 'svelte';
  import CommandPalette from './components/CommandPalette.svelte';
  import SettingsPanel from './components/SettingsPanel.svelte';
  import { stopAmbientSound, syncAmbientSound } from './lib/sound/ambient-sound';
  import DraftsRoute from './routes/drafts.svelte';
  import EditorRoute from './routes/editor.svelte';
  import { createDraftAndOpen, loadDrafts, watchDrafts } from './stores/drafts.store';
  import { loadSettings, settings, updateSettings, watchSettings } from './stores/settings.store';

  let draftPanelOpen = $state(false);
  let commandPaletteOpen = $state(false);
  let settingsPanelOpen = $state(false);

  const toggleDraftPanel = () => {
    draftPanelOpen = !draftPanelOpen;
  };

  const closeDraftPanel = () => {
    draftPanelOpen = false;
  };

  const closeCommandPalette = () => {
    commandPaletteOpen = false;
  };

  const openSettingsPanel = () => {
    settingsPanelOpen = true;
  };

  const closeSettingsPanel = () => {
    settingsPanelOpen = false;
  };

  const createDraftFromShortcut = async () => {
    const draft = await createDraftAndOpen();

    if (draft) {
      closeDraftPanel();
    }
  };

  const handleKeydown = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    const usesPrimaryModifier = event.ctrlKey || event.metaKey;

    if (event.key === 'Escape') {
      closeSettingsPanel();
      closeCommandPalette();
      closeDraftPanel();
      return;
    }

    if (usesPrimaryModifier && !event.shiftKey && key === 'p') {
      event.preventDefault();
      commandPaletteOpen = !commandPaletteOpen;
      return;
    }

    if (usesPrimaryModifier && !event.shiftKey && key === ',') {
      event.preventDefault();
      openSettingsPanel();
      return;
    }

    if (usesPrimaryModifier && !event.shiftKey && key === 'n') {
      event.preventDefault();
      void createDraftFromShortcut();
      return;
    }

    if (usesPrimaryModifier && event.shiftKey && key === 'f') {
      event.preventDefault();
      void updateSettings({ focusModeDefault: !$settings.focusModeDefault });
      return;
    }

    if (usesPrimaryModifier && event.shiftKey && key === 't') {
      event.preventDefault();
      void updateSettings({ typewriterMode: !$settings.typewriterMode });
      return;
    }

    if (usesPrimaryModifier && !event.shiftKey && key === 'b') {
      event.preventDefault();
      toggleDraftPanel();
    }
  };

  onMount(() => {
    void loadSettings();
    void loadDrafts();

    const unwatchDrafts = watchDrafts();
    const unwatchSettings = watchSettings();
    const unwatchAmbientSound = settings.subscribe((nextSettings) => {
      syncAmbientSound(nextSettings);
    });

    return () => {
      stopAmbientSound();
      unwatchAmbientSound();
      unwatchSettings();
      unwatchDrafts();
    };
  });
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
  <title>qwill</title>
</svelte:head>

<div
  class:focus-mode={$settings.focusModeDefault}
  class="app-shell"
  data-theme={$settings.theme}
  data-font={$settings.font}
  style={`--font-size: ${$settings.fontSize}px; --line-height: ${$settings.lineHeight}; --max-width: ${$settings.maxLineWidth}px;`}
>
  <header class="titlebar">
    <button class="titlebar-button" type="button" aria-label="Toggle drafts" onclick={toggleDraftPanel}>
      <span class="chrome-icon chrome-icon-menu" aria-hidden="true"></span>
    </button>
    <div class="titlebar-drag">
      <span class="app-name">qwill</span>
    </div>
    <div class="window-controls">
      <button class="window-button" type="button" aria-label="Minimize" onclick={() => window.qwill.window.minimize()}>
        <span class="chrome-icon chrome-icon-minimize" aria-hidden="true"></span>
      </button>
      <button
        class="window-button"
        type="button"
        aria-label="Maximize or restore"
        onclick={() => window.qwill.window.toggleMaximize()}
      >
        <span class="chrome-icon chrome-icon-maximize" aria-hidden="true"></span>
      </button>
      <button class="window-button" type="button" aria-label="Close" onclick={() => window.qwill.window.close()}>
        <span class="chrome-icon chrome-icon-close" aria-hidden="true"></span>
      </button>
    </div>
  </header>

  <main class="workspace">
    <DraftsRoute open={draftPanelOpen} onclose={closeDraftPanel} />
    <EditorRoute />
  </main>

  <CommandPalette
    open={commandPaletteOpen}
    onclose={closeCommandPalette}
    onopenSettings={() => {
      openSettingsPanel();
    }}
  />
  <SettingsPanel open={settingsPanelOpen} onclose={closeSettingsPanel} />
</div>
