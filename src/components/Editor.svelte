<script lang="ts">
  import { EditorView } from '@codemirror/view';
  import { onDestroy, onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { createEditorState, typewriterCompartment } from '../lib/codemirror/editor-extensions';
  import { typewriterScrollExtension } from '../lib/codemirror/typewriter';
  import { createAutosave } from '../lib/autosave';
  import { content, saveActiveDraft, updateEditorContent } from '../stores/editor.store';
  import { settings } from '../stores/settings.store';

  let editorHost: HTMLDivElement;
  let view: EditorView | null = null;
  let isApplyingStoreUpdate = false;
  const autosave = createAutosave(saveActiveDraft);

  onMount(() => {
    view = new EditorView({
      parent: editorHost,
      state: createEditorState(get(content), {
        typewriterMode: get(settings).typewriterMode,
        onChange: (nextContent) => {
          if (isApplyingStoreUpdate) return;

          updateEditorContent(nextContent);
          autosave.onChange();
        }
      })
    });

    const unsubscribeContent = content.subscribe((nextContent) => {
      if (!view) return;

      const currentContent = view.state.doc.toString();
      if (currentContent === nextContent) return;

      try {
        isApplyingStoreUpdate = true;
        view.dispatch({
          changes: {
            from: 0,
            to: currentContent.length,
            insert: nextContent
          }
        });
      } finally {
        isApplyingStoreUpdate = false;
      }
    });

    const unsubscribeSettings = settings.subscribe(($settings) => {
      view?.dispatch({
        effects: typewriterCompartment.reconfigure(typewriterScrollExtension($settings.typewriterMode))
      });
    });

    return () => {
      unsubscribeSettings();
      unsubscribeContent();
      view?.destroy();
      view = null;
    };
  });

  onDestroy(() => {
    autosave.destroy();
  });
</script>

<div class="editor-column">
  <div bind:this={editorHost} class="editor-surface"></div>
</div>
