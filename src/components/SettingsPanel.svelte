<script lang="ts">
  import {
    ambientSoundError,
    ambientSoundPlaying,
    startAmbientSound,
    stopAmbientSound
  } from '../lib/sound/ambient-sound';
  import { settings, updateSettings } from '../stores/settings.store';
  import type { AmbientSound, FontFamily, Theme } from '../types/qwill';

  interface Props {
    open: boolean;
    onclose: () => void;
  }

  let { open, onclose }: Props = $props();

  const themes: Theme[] = ['light', 'dark', 'sepia'];
  const fonts: FontFamily[] = ['lora', 'ia-writer-quattro', 'merriweather', 'georgia', 'system'];
  const ambientSounds: AmbientSound[] = ['none', 'rain', 'cafe', 'white-noise'];

  const toggleAmbientSound = async () => {
    if ($ambientSoundPlaying) {
      stopAmbientSound();
      return;
    }

    const ambientSound = $settings.ambientSound === 'none' ? 'rain' : $settings.ambientSound;

    if ($settings.ambientSound === 'none') {
      await updateSettings({ ambientSound });
    }

    startAmbientSound({ ambientSound, ambientVolume: $settings.ambientVolume });
  };
</script>

{#if open}
  <button class="modal-backdrop" type="button" aria-label="Close settings" onclick={onclose}></button>

  <div class="settings-panel" role="dialog" aria-modal="true" aria-label="Settings" tabindex="-1">
    <header class="settings-panel-header">
      <h2>Settings</h2>
      <button class="icon-button" type="button" aria-label="Close settings" onclick={onclose}>
        <span class="chrome-icon chrome-icon-close" aria-hidden="true"></span>
      </button>
    </header>

    <div class="settings-grid">
      <label>
        <span>Theme</span>
        <select
          value={$settings.theme}
          onchange={(event) => updateSettings({ theme: event.currentTarget.value as Theme })}
        >
          {#each themes as theme}
            <option value={theme}>{theme}</option>
          {/each}
        </select>
      </label>

      <label>
        <span>Font</span>
        <select
          value={$settings.font}
          onchange={(event) => updateSettings({ font: event.currentTarget.value as FontFamily })}
        >
          {#each fonts as font}
            <option value={font}>{font}</option>
          {/each}
        </select>
      </label>

      <label>
        <span>Font size {$settings.fontSize}px</span>
        <input
          type="range"
          min="14"
          max="22"
          step="1"
          value={$settings.fontSize}
          oninput={(event) => updateSettings({ fontSize: Number(event.currentTarget.value) })}
        />
      </label>

      <label>
        <span>Line height {$settings.lineHeight.toFixed(1)}</span>
        <input
          type="range"
          min="1.5"
          max="2.2"
          step="0.1"
          value={$settings.lineHeight}
          oninput={(event) => updateSettings({ lineHeight: Number(event.currentTarget.value) })}
        />
      </label>

      <label>
        <span>Line width {$settings.maxLineWidth}px</span>
        <input
          type="range"
          min="560"
          max="800"
          step="20"
          value={$settings.maxLineWidth}
          oninput={(event) => updateSettings({ maxLineWidth: Number(event.currentTarget.value) })}
        />
      </label>

      <label>
        <span>Ambient sound</span>
        <select
          value={$settings.ambientSound}
          onchange={(event) => updateSettings({ ambientSound: event.currentTarget.value as AmbientSound })}
        >
          {#each ambientSounds as sound}
            <option value={sound}>{sound}</option>
          {/each}
        </select>
      </label>

      <label>
        <span>Ambient volume {Math.round($settings.ambientVolume * 100)}%</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={$settings.ambientVolume}
          oninput={(event) => updateSettings({ ambientVolume: Number(event.currentTarget.value) })}
        />
      </label>

      <div class="sound-control">
        <button class="settings-button" type="button" onclick={toggleAmbientSound}>
          {$ambientSoundPlaying ? 'Stop ambient sound' : 'Start ambient sound'}
        </button>
        {#if $ambientSoundError}
          <p>{$ambientSoundError}</p>
        {/if}
      </div>
    </div>

    <div class="settings-toggles">
      <label><input type="checkbox" checked={$settings.typewriterMode} onchange={(event) => updateSettings({ typewriterMode: event.currentTarget.checked })} /> Typewriter mode</label>
      <label><input type="checkbox" checked={$settings.focusModeDefault} onchange={(event) => updateSettings({ focusModeDefault: event.currentTarget.checked })} /> Focus mode</label>
      <label><input type="checkbox" checked={$settings.showWordCount} onchange={(event) => updateSettings({ showWordCount: event.currentTarget.checked })} /> Word count</label>
      <label><input type="checkbox" checked={$settings.showSessionTimer} onchange={(event) => updateSettings({ showSessionTimer: event.currentTarget.checked })} /> Session timer</label>
      <label><input type="checkbox" checked={$settings.showStreak} onchange={(event) => updateSettings({ showStreak: event.currentTarget.checked })} /> Writing streak</label>
    </div>
  </div>
{/if}
