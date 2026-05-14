import type { Extension } from '@codemirror/state';
import { ViewPlugin, type ViewUpdate } from '@codemirror/view';

const CURSOR_TARGET_RATIO = 0.45;

const typewriterScrollPlugin = ViewPlugin.fromClass(
  class {
    update(update: ViewUpdate): void {
      if (!update.selectionSet && !update.docChanged) return;

      const { view } = update;
      const cursor = view.coordsAtPos(view.state.selection.main.head);
      if (!cursor) return;

      const scrollContainer = view.dom.closest<HTMLElement>('.editor-column') ?? view.scrollDOM;
      const editorTop = scrollContainer.getBoundingClientRect().top;
      const currentY = cursor.top - editorTop;
      const targetY = scrollContainer.clientHeight * CURSOR_TARGET_RATIO;

      scrollContainer.scrollTop += currentY - targetY;
    }
  }
);

export function typewriterScrollExtension(enabled: boolean): Extension {
  return enabled ? typewriterScrollPlugin : [];
}
