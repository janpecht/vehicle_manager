/**
 * Strips HTML tags from a string to prevent stored XSS.
 * Preserves the text content between tags.
 */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}
