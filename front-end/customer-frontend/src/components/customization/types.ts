export const regions = ['body', 'border', 'padar', 'butti'] as const;
export type RegionName = typeof regions[number];
export type Region = { targets: string[]; repeatX: number; repeatY: number; offsetX: number; offsetY: number; rotation: number };
export type Mapping = { modelKey: string; regions: Partial<Record<RegionName, Region>> };
export type Option = { id: string; name: string; url: string | null; hexCode: string | null };
export type StudioData = { modelKey: string; modelUrl: string; mapping: Mapping; staleMapping: boolean;
  padar: Option[]; border: Option[]; butti: Option[]; bodyColors: Option[]; borderColors: Option[] };
export type Part = { id: string; label: string; uv: boolean; editable: boolean };
export type Appearance = { bodyColor: string; borderColor: string; padar: string; border: string; butti: string };
export const emptyRegion = (): Region => ({ targets: [], repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0, rotation: 0 });
export function validateMapping(mapping: Mapping, parts: Part[]): string[] {
  const errors: string[] = [], used = new Set<string>();
  for (const name of regions) {
    const region = mapping.regions[name];
    if (!region) continue;
    for (const id of region.targets) {
      const part = parts.find(p => p.id === id);
      if (!part) errors.push(`${name}: a mapped part no longer exists. Reload and assign it again.`);
      else if (!part.editable) errors.push(`${name}: ${part.label} does not support color or texture editing.`);
      else if (name !== 'body' && !part.uv) errors.push(`${name}: ${part.label} has no UV coordinates for textures.`);
      if (used.has(id)) errors.push('A material slot cannot belong to two regions.');
      used.add(id);
    }
    for (const key of ['repeatX', 'repeatY', 'offsetX', 'offsetY', 'rotation'] as const) {
      const v = region[key], min = key.startsWith('repeat') ? 0.01 : key === 'rotation' ? -360 : -10;
      const max = key.startsWith('repeat') ? 100 : key === 'rotation' ? 360 : 10;
      if (!Number.isFinite(v) || v < min || v > max) errors.push(`${name}: ${key} must be between ${min} and ${max}.`);
    }
  }
  return [...new Set(errors)];
}
