export function toCapitalCase(text: string | null | undefined): string {
  if (!text) return '';
  return text.toUpperCase();
}
