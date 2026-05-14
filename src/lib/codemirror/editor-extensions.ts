import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { Compartment, EditorState, type Extension } from '@codemirror/state';
import { drawSelection, dropCursor, EditorView, keymap, placeholder } from '@codemirror/view';
import { markdownDecorations } from './markdown-decorations';
import { typewriterScrollExtension } from './typewriter';

export const typewriterCompartment = new Compartment();

interface EditorExtensionOptions {
  typewriterMode: boolean;
  onChange: (content: string) => void;
}

export function createEditorState(doc: string, options: EditorExtensionOptions): EditorState {
  return EditorState.create({
    doc,
    extensions: createEditorExtensions(options)
  });
}

function createEditorExtensions(options: EditorExtensionOptions): Extension[] {
  return [
    markdown({ base: markdownLanguage }),
    EditorView.lineWrapping,
    drawSelection(),
    dropCursor(),
    history(),
    placeholder('# Untitled\n\nStart writing...'),
    keymap.of([...historyKeymap, ...defaultKeymap]),
    EditorView.contentAttributes.of({
      'aria-label': 'Draft editor',
      autocapitalize: 'sentences',
      autocorrect: 'on',
      spellcheck: 'true'
    }),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        options.onChange(update.state.doc.toString());
      }
    }),
    markdownDecorations(),
    typewriterCompartment.of(typewriterScrollExtension(options.typewriterMode))
  ];
}
