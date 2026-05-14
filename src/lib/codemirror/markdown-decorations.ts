import { syntaxTree } from '@codemirror/language';
import { RangeSetBuilder, type Extension } from '@codemirror/state';
import { Decoration, type DecorationSet, EditorView, ViewPlugin, type ViewUpdate } from '@codemirror/view';

const markdownMarkerDecoration = Decoration.mark({ class: 'cm-qwill-mark' });
const strongDecoration = Decoration.mark({ class: 'cm-qwill-strong' });
const emphasisDecoration = Decoration.mark({ class: 'cm-qwill-emphasis' });
const headingLineDecoration = Decoration.line({ class: 'cm-qwill-heading' });
const headingOneLineDecoration = Decoration.line({ class: 'cm-qwill-heading-1' });
const headingTwoLineDecoration = Decoration.line({ class: 'cm-qwill-heading-2' });
const blockquoteLineDecoration = Decoration.line({ class: 'cm-qwill-blockquote' });
const dividerLineDecoration = Decoration.line({ class: 'cm-qwill-divider' });

export function markdownDecorations(): Extension {
  return markdownDecorationPlugin;
}

const markdownDecorationPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = buildMarkdownDecorations(view);
    }

    update(update: ViewUpdate): void {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = buildMarkdownDecorations(update.view);
      }
    }
  },
  {
    decorations: (plugin) => plugin.decorations
  }
);

function buildMarkdownDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const ranges: Array<{ from: number; to: number; decoration: Decoration }> = [];
  const decoratedLines = new Set<string>();

  syntaxTree(view.state).iterate({
    from: view.viewport.from,
    to: view.viewport.to,
    enter: (node) => {
      const name = node.name;

      if (isHeadingNode(name)) {
        addLineDecoration(view, ranges, decoratedLines, node.from, headingLineDecoration, 'heading');

        if (name.endsWith('1')) {
          addLineDecoration(view, ranges, decoratedLines, node.from, headingOneLineDecoration, 'heading-1');
        }

        if (name.endsWith('2')) {
          addLineDecoration(view, ranges, decoratedLines, node.from, headingTwoLineDecoration, 'heading-2');
        }
      }

      if (isBlockquoteNode(name)) {
        addLineDecoration(view, ranges, decoratedLines, node.from, blockquoteLineDecoration, 'blockquote');
      }

      if (isDividerNode(name)) {
        addLineDecoration(view, ranges, decoratedLines, node.from, dividerLineDecoration, 'divider');
      }

      if (isMarkerNode(name)) {
        ranges.push({ from: node.from, to: node.to, decoration: markdownMarkerDecoration });
      }

      if (name === 'StrongEmphasis') {
        ranges.push({ from: node.from, to: node.to, decoration: strongDecoration });
      }

      if (name === 'Emphasis') {
        ranges.push({ from: node.from, to: node.to, decoration: emphasisDecoration });
      }
    }
  });

  ranges
    .sort((a, b) => a.from - b.from || getStartSide(a.decoration) - getStartSide(b.decoration) || a.to - b.to)
    .forEach(({ from, to, decoration }) => builder.add(from, to, decoration));

  return builder.finish();
}

function addLineDecoration(
  view: EditorView,
  ranges: Array<{ from: number; to: number; decoration: Decoration }>,
  decoratedLines: Set<string>,
  position: number,
  decoration: Decoration,
  classKey: string
): void {
  const line = view.state.doc.lineAt(position);
  const key = `${line.from}:${classKey}`;

  if (decoratedLines.has(key)) {
    return;
  }

  decoratedLines.add(key);
  ranges.push({ from: line.from, to: line.from, decoration });
}

function getStartSide(decoration: Decoration): number {
  return (decoration as unknown as { startSide?: number }).startSide ?? 0;
}

function isHeadingNode(name: string): boolean {
  return /^ATXHeading[1-6]$/.test(name);
}

function isBlockquoteNode(name: string): boolean {
  return name === 'Blockquote' || name === 'QuoteMark';
}

function isDividerNode(name: string): boolean {
  return name === 'HorizontalRule';
}

function isMarkerNode(name: string): boolean {
  return name === 'HeaderMark' || name === 'EmphasisMark' || name === 'QuoteMark';
}
