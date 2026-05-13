import { stripFrontMatter } from './markdown';

export function markdownToPlainText(markdown: string): string {
  return stripFrontMatter(markdown)
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .trim();
}
