export function toCapitalCase(text: string | null | undefined): string {
  if (!text) return '';
  return text.toUpperCase();
}

export function toSentenceCase(text: string | null | undefined): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export function toTitleCase(text: string | null | undefined): string {
  if (!text) return '';
  return text.toLowerCase().replace(/(^|\s)(\S)/g, (_, space, letter) =>
    space + letter.toUpperCase()
  );
}
