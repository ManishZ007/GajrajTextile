import type { StudioData, Appearance } from './types';

export const fields = [
  { key: 'bodyColor', list: 'bodyColors', region: 'body', label: 'Body color' },
  { key: 'borderColor', list: 'borderColors', region: 'border', label: 'Border color' },
  { key: 'border', list: 'border', region: 'border', label: 'Border / Kinar design' },
  { key: 'padar', list: 'padar', region: 'padar', label: 'Padar / Pallu design' },
  { key: 'butti', list: 'butti', region: 'butti', label: 'Butti design' },
] as const;
export type Selections = Record<typeof fields[number]['key'], string>;
export const original: Selections = { bodyColor: '', borderColor: '', border: '', padar: '', butti: '' };
export function validSelections(data: StudioData, input: Partial<Selections>): Selections {
  const result = { ...original };
  for (const f of fields) {
    const id = input[f.key];
    if (data.mapping.regions[f.region]?.targets.length && data[f.list].some(o => o.id === id)) result[f.key] = id!;
  }
  return result;
}
export function appearanceFor(data: StudioData, selections: Selections): Appearance {
  const result = { ...original };
  for (const f of fields) {
    const choice = data[f.list].find(o => o.id === selections[f.key]);
    result[f.key] = f.key === 'bodyColor' || f.key === 'borderColor' ? choice?.hexCode ?? '' : choice?.url ?? '';
  }
  return result;
}
