<script lang="ts">
  import { tick } from 'svelte';
  import { get } from 'svelte/store';
  import {
    ambientSoundPlaying,
    startAmbientSound,
    stopAmbientSound
  } from '../lib/sound/ambient-sound';
  import { activeDraftId, saveActiveDraft } from '../stores/editor.store';
  import { settings, updateSettings } from '../stores/settings.store';
  import type { Theme } from '../types/qwill';

  interface Props {
    open: boolean;
    onclose: () => void;
    onopenSettings: () => void;
  }

  let { open, onclose, onopenSettings }: Props = $props();
  let query = $state('');
  let statusMessage = $state('');
  let commandInput = $state<HTMLInputElement>();

  interface Command {
    label: string;
    run: () => void | Promise<void>;
    closeOnRun?: boolean;
  }

  const themes: Theme[] = ['light', 'dark', 'sepia'];

  const toggleTheme = () => {
    const currentIndex = themes.indexOf($settings.theme);
    const theme = themes[(currentIndex + 1) % themes.length];
    void updateSettings({ theme });
  };

  const toggleAmbientSound = async () => {
    if ($ambientSoundPlaying) {
      stopAmbientSound();
      statusMessage = 'Ambient sound stopped.';
      return;
    }

    const ambientSound = $settings.ambientSound === 'none' ? 'rain' : $settings.ambientSound;

    if ($settings.ambientSound === 'none') {
      await updateSettings({ ambientSound });
    }

    const started = startAmbientSound({ ambientSound, ambientVolume: $settings.ambientVolume });
    statusMessage = started ? `Playing ${ambientSound.replace('-', ' ')}.` : 'Choose an ambient sound first.';
  };

  const exportActiveDraft = async (format: 'markdown' | 'txt' | 'pdf') => {
    statusMessage = '';

    try {
      await saveActiveDraft();

      const draftId = get(activeDraftId);
      if (!draftId) {
        statusMessage = 'Nothing to export yet.';
        return;
      }

      const result =
        format === 'markdown'
          ? await window.qwill.files.exportMarkdown(draftId)
          : format === 'txt'
            ? await window.qwill.files.exportTxt(draftId)
            : await window.qwill.files.exportPDF(draftId);

      statusMessage = result.canceled ? 'Export canceled.' : `Exported to ${result.path}`;
    } catch (error) {
      statusMessage = error instanceof Error ? error.message : 'Export failed.';
    }
  };

  const commands = $derived<Command[]>([
    {
      label: 'Toggle Theme',
      run: toggleTheme
    },
    {
      label: 'Toggle Focus Mode',
      run: () => updateSettings({ focusModeDefault: !$settings.focusModeDefault })
    },
    {
      label: 'Toggle Typewriter Mode',
      run: () => updateSettings({ typewriterMode: !$settings.typewriterMode })
    },
    {
      label: 'Toggle Ambient Sound',
      run: toggleAmbientSound,
      closeOnRun: false
    },
    {
      label: 'Open Drafts Folder',
      run: () => window.qwill.shell.openDraftsFolder()
    },
    {
      label: 'Export as PDF',
      run: () => exportActiveDraft('pdf'),
      closeOnRun: false
    },
    {
      label: 'Export as Markdown',
      run: () => exportActiveDraft('markdown'),
      closeOnRun: false
    },
    {
      label: 'Export as Plain Text',
      run: () => exportActiveDraft('txt'),
      closeOnRun: false
    },
    {
      label: 'Settings',
      run: onopenSettings
    }
  ]);

  const filteredCommands = $derived(
    commands.filter((command) => command.label.toLowerCase().includes(query.trim().toLowerCase()))
  );

  const runCommand = async (command: Command) => {
    await command.run();
    if (command.closeOnRun ?? true) {
      query = '';
      statusMessage = '';
      onclose();
    }
  };

  const handleKeydown = (event: KeyboardEvent) => {
    event.stopPropagation();

    if (event.key === 'Escape') {
      event.preventDefault();
      query = '';
      statusMessage = '';
      onclose();
    }
  };

  $effect(() => {
    if (!open) return;

    void tick().then(() => {
      commandInput?.focus();
    });
  });
</script>

{#if open}
  <button class="modal-backdrop" type="button" aria-label="Close command palette" onclick={onclose}></button>

  <div class="command-palette" role="dialog" aria-label="Command palette" tabindex="-1" onkeydown={handleKeydown}>
    <input bind:this={commandInput} bind:value={query} type="search" placeholder="Command" />

    {#if statusMessage}
      <p class="command-status">{statusMessage}</p>
    {/if}

    <div class="command-list">
      {#if filteredCommands.length === 0}
        <p class="empty-state">No commands found.</p>
      {:else}
        {#each filteredCommands as command}
          <button class="command-item" type="button" onclick={() => runCommand(command)}>
            {command.label}
          </button>
        {/each}
      {/if}
    </div>
  </div>
{/if}
