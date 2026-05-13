export function countWords(markdown: string): number {
  const words = markdown
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return markdown.trim().length === 0 ? 0 : words.length;
}

export function estimateReadingTime(wordCount: number): number {
  if (wordCount === 0) return 0;

  return Math.ceil(wordCount / 200);
}
