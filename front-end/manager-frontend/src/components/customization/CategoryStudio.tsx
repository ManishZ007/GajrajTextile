'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/apiFetch';
import { Appearance, Mapping, Part, RegionName, StudioData, emptyRegion, regions, validateMapping } from './types';
const ModelPreview = dynamic(() => import('./ModelPreview'), { ssr: false, loading: () => <p className="p-12">Preparing 3D preview…</p> });
const labels: Record<RegionName,string> = { body:'Body',border:'Border / Kinar',padar:'Padar / Pallu',butti:'Butti' };
const control = 'w-full rounded-lg border border-gray-300 bg-white p-2 text-sm';
const blankAppearance = (): Appearance => ({ bodyColor:'',borderColor:'',padar:'',border:'',butti:'' });

export default function CategoryStudio({ categoryId, revision }: { categoryId: string; revision: number }) {
  const [data,setData]=useState<StudioData|null>(null), [error,setError]=useState(''), [reload,setReload]=useState(0);
  useEffect(()=> {
    let live=true;setData(null);setError('');
    apiFetch(`http://localhost:8087/product/categories/${categoryId}/studio`,{cache:'no-store'}).then(value=>{if(live)setData(value);})
      .catch(e=>{if(live)setError(e instanceof Error?e.message:'Could not load customization data');});
    return ()=>{live=false;};
  },[categoryId,revision,reload]);
  return <section className="rounded-2xl border border-white/70 bg-white/70 p-5">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-lg font-semibold">3D customization studio</h2><p className="text-sm text-gray-500">Assign model parts, then test your category’s textures and colors.</p></div>
      <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={()=>{
        if(window.confirm('Reload saved assets and mapping? Unsaved preview changes will be discarded.'))setReload(n=>n+1);
      }}>Reload assets</button>
    </div>
    {error ? <p role="alert" className="text-red-700">{error}</p> : !data ? <p>Loading category configuration…</p>
      : !data.modelUrl ? <p className="rounded-lg bg-amber-50 p-4 text-sm">Upload and save a category base model above to begin. A self-contained GLB is recommended.</p>
      : <Editor key={`${categoryId}:${revision}:${reload}`} data={data} categoryId={categoryId} />}
  </section>;
}

export function Editor({data,categoryId}:{data:StudioData;categoryId:string}) {
  const [mapping,setMapping]=useState<Mapping>(data.mapping);
  const [parts,setParts]=useState<Part[]>([]),[active,setActive]=useState<RegionName>('body');
  const [appearance,setAppearance]=useState<Appearance>(blankAppearance);
  const [highlight,setHighlight]=useState(false),[solid,setSolid]=useState(false);
  const [paintError,setPaintError]=useState(''),[saveError,setSaveError]=useState(''),[saved,setSaved]=useState(false),[saving,setSaving]=useState(false);
  const region=mapping.regions[active]??emptyRegion();
  const issues=parts.length?validateMapping(mapping,parts):[];
  const assigned=regions.reduce((total,name)=>total+(mapping.regions[name]?.targets.length??0),0);
  function patch(change:Partial<typeof region>) {
    setSaved(false);setMapping(current=>({...current,regions:{...current.regions,[active]:{...(current.regions[active]??emptyRegion()),...change}}}));
  }
  function assign(id:string,checked:boolean) {
    setSaved(false);
    setMapping(current=> {
      const next={...current,regions:{...current.regions}};
      // Explicit assignment moves a slot between regions, never paints two regions over it.
      for(const name of regions) {const r=next.regions[name];if(r)next.regions[name]={...r,targets:r.targets.filter(t=>t!==id)};}
      const r=next.regions[active]??emptyRegion();next.regions[active]={...r,targets:checked?[...r.targets,id]:r.targets};return next;
    });
  }
  async function save() {
    setSaveError('');setSaved(false);setSaving(true);
    try {await apiFetch(`http://localhost:8087/product/categories/${categoryId}/studio`,{method:'PUT',body:JSON.stringify(mapping)});setSaved(true);}
    catch(e){setSaveError(e instanceof Error?e.message:'Could not save mapping');}finally{setSaving(false);}
  }
  return <>
    {data.staleMapping && <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm">The base model has changed. Its previous part assignments have been cleared for this preview; assign the new model before saving.</p>}
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)]">
      <div className="min-w-0">
        <ModelPreview url={data.modelUrl} mapping={mapping} appearance={appearance} highlight={highlight?active:''} solidColor={solid} onParts={setParts} onError={setPaintError}/>
        {paintError && <p role="alert" className="mt-2 text-sm text-red-700">{paintError}</p>}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <label><input type="checkbox" checked={highlight} onChange={e=>setHighlight(e.target.checked)}/> Highlight selected region</label>
          <label><input type="checkbox" checked={solid} onChange={e=>setSolid(e.target.checked)}/> Test solid colors without original color maps</label>
          <button type="button" className="underline" onClick={()=>{setAppearance(blankAppearance());setSolid(false);setHighlight(false);}}>Reset appearance</button>
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap gap-2" aria-label="Customization regions">
          {regions.map(name=><button key={name} type="button" aria-pressed={active===name} onClick={()=>setActive(name)} className={`rounded-lg px-3 py-2 text-sm ${active===name?'bg-black text-white':'bg-gray-100'}`}>{labels[name]}</button>)}
        </div>
        <div>
          <h3 className="font-medium">Model parts for {labels[active]}</h3>
          <p className="mb-2 text-xs text-gray-500">Select garment parts only. A slot can belong to one region. Leave mannequin parts unassigned.</p>
          <div className="max-h-52 overflow-auto rounded-lg border bg-white p-2">
            {!parts.length && <p className="p-2 text-sm text-gray-500">Parts appear once the model loads.</p>}
            {parts.map(part=><label key={part.id} className="flex items-start gap-2 border-b border-gray-100 py-2 text-xs">
              <input type="checkbox" className="mt-0.5" checked={region.targets.includes(part.id)} disabled={!part.editable || (active!=='body'&&!part.uv)} onChange={e=>assign(part.id,e.target.checked)}/>
              <span className="break-all">{part.label}{!part.uv?' — no UVs':''}{!part.editable?' — unsupported material':''}
                {regions.filter(n=>n!==active&&mapping.regions[n]?.targets.includes(part.id)).map(n=>` — assigned to ${labels[n]}`)}</span>
            </label>)}
          </div>
          <button type="button" onClick={()=>patch({targets:[]})} className="mt-1 text-xs underline">Clear this region</button>
        </div>
        {active!=='body' && <>
          <label className="text-sm">Preview texture<select className={control} value={appearance[active]} onChange={e=>setAppearance({...appearance,[active]:e.target.value})}>
            <option value="">Original model texture</option>{data[active].map(option=><option key={option.id} value={option.url??''}>{option.name}</option>)}
          </select></label>
          {!data[active].length && <p className="text-xs text-amber-800">No textures in this category yet. Add them in the asset tabs and reload.</p>}
          <div className="grid grid-cols-2 gap-2">
            {(['repeatX','repeatY','offsetX','offsetY','rotation'] as const).map(key=><label className="text-xs" key={key}>{({repeatX:'Repeat horizontally',repeatY:'Repeat vertically',offsetX:'Horizontal offset',offsetY:'Vertical offset',rotation:'Rotation (degrees)'})[key]}
              <input type="number" step={key==='rotation'?1:0.1} className={control} value={region[key]} onChange={e=>patch({[key]:e.target.value===''?0:Number(e.target.value)})}/></label>)}
          </div>
        </>}
        {(active==='body'||active==='border') && <label className="text-sm">Preview color
          <select className={control} value={active==='body'?appearance.bodyColor:appearance.borderColor} onChange={e=>setAppearance({...appearance,[active==='body'?'bodyColor':'borderColor']:e.target.value})}>
            <option value="">Original model color</option>{(active==='body'?data.bodyColors:data.borderColors).map(option=><option key={option.id} value={option.hexCode??''}>{option.name} ({option.hexCode})</option>)}
          </select>
        </label>}
        {!region.targets.length && <p className="text-sm text-amber-800">Assign a model part to see changes to this region.</p>}
      </div>
    </div>
    <div className="mt-5 border-t pt-4">
      <p className="text-sm text-gray-600">{parts.length} material slots found · {assigned} assigned. Texture regions need UV coordinates. If a whole saree is one slot, your designer must split its regions into separate material slots to customize them independently.</p>
      <p className="mt-1 text-xs text-gray-500">Save stores part assignments and texture placement. Preview selections do not change product defaults or publish a customer configurator.</p>
      {issues.map(issue=><p key={issue} className="mt-1 text-sm text-red-700">{issue}</p>)}
      {saveError && <p role="alert" className="mt-2 text-red-700">{saveError}</p>}
      {saved && <p role="status" className="mt-2 text-emerald-700">Category mapping saved.</p>}
      <button type="button" disabled={saving||!parts.length||issues.length>0} onClick={save} className="mt-4 rounded-xl bg-black px-5 py-2 text-white disabled:opacity-40">{saving?'Saving…':'Save category mapping'}</button>
    </div>
  </>;
}
