export function stripFrontMatter(markdown: string): string {
  if (!markdown.startsWith('---')) {
    return markdown;
  }

  const end = markdown.indexOf('\n---', 3);
  if (end === -1) {
    return markdown;
  }

  return markdown.slice(end + 4).replace(/^\s+/, '');
}
