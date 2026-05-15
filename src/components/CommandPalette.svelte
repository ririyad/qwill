<script lang="ts">
  import { tick } from 'svelte';
  import { settings, updateSettings } from '../stores/settings.store';
  import type { Theme } from '../types/qwill';

  interface Props {
    open: boolean;
    onclose: () => void;
    onopenSettings: () => void;
  }

  let { open, onclose, onopenSettings }: Props = $props();
  let query = $state('');
  let commandInput = $state<HTMLInputElement>();

  interface Command {
    label: string;
    run: () => void | Promise<void>;
  }

  const themes: Theme[] = ['light', 'dark', 'sepia'];

  const toggleTheme = () => {
    const currentIndex = themes.indexOf($settings.theme);
    const theme = themes[(currentIndex + 1) % themes.length];
    void updateSettings({ theme });
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
      label: 'Open Drafts Folder',
      run: () => window.qwill.shell.openDraftsFolder()
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
    query = '';
    onclose();
  };

  const handleKeydown = (event: KeyboardEvent) => {
    event.stopPropagation();

    if (event.key === 'Escape') {
      event.preventDefault();
      query = '';
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
