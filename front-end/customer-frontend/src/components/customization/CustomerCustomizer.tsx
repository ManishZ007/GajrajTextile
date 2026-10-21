'use client';
import { useEffect, useMemo, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { fields, validSelections, appearanceFor, Selections } from './selection';
import { StudioData, Part, validateMapping } from './types';
const ModelPreview = dynamic(() => import('./ModelPreview'), { ssr: false });
type Config = StudioData & { productId: string; productName: string; categoryName: string; basePrice: number; configurationVersion: string; defaults: Selections };
const inputClass = 'w-full border border-black/20 bg-white p-3 text-sm';

export default function CustomerCustomizer({ productId }: { productId: string }) {
  const [data, setData] = useState<Config | null>(null), [error, setError] = useState(''), [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setData(null); setError('');
    fetch(`/api/customization/${productId}`, { signal: controller.signal, cache: 'no-store' })
      .then(async r => { const d = await r.json(); if (!r.ok) throw Error(d.error || 'Unable to load customization'); return d; })
      .then(setData).catch(e => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, [productId, reload]);
  return <main className="max-w-7xl mx-auto px-6 py-10">
    <div className="flex justify-between gap-4 mb-6"><Link href="/customize">Choose a product</Link><Link href="/custom-designs">My design requests</Link></div>
    {error ? <div role="alert"><p>{error}</p><button className={inputClass} onClick={() => setReload(v => v + 1)}>Try again</button></div>
      : !data ? <p role="status">Loading customization options…</p>
      : <Designer key={`${productId}:${reload}`} data={data} onReload={() => setReload(v => v + 1)} />}
  </main>;
}

function Designer({ data, onReload }: { data: Config; onReload: () => void }) {
  const [selections, setSelections] = useState(() => validSelections(data, data.defaults));
  const [parts, setParts] = useState<Part[]>([]), [previewError, setPreviewError] = useState('');
  const [name, setName] = useState(''), [phone, setPhone] = useState(''), [notes, setNotes] = useState('');
  const [error, setError] = useState(''), [notice, setNotice] = useState(''), [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState<{ id: string; reference: string } | null>(null);
  const attempt = useRef<{ hash: string; id: string } | null>(null);
  const appearance = useMemo(() => appearanceFor(data, selections), [data, selections]);
  const issues = useMemo(() => parts.length ? validateMapping(data.mapping, parts) : [], [parts, data.mapping]);
  const draftKey = `custom-design:${data.productId}`;
  function saveDraft() {
    try {
      localStorage.setItem(draftKey, JSON.stringify({ configurationVersion: data.configurationVersion, selections }));
      setNotice('Design saved on this browser. Contact details are not saved.');
    } catch { setError('This browser could not save your design.'); }
  }
  function restoreDraft() {
    try {
      const draft = JSON.parse(localStorage.getItem(draftKey) || 'null');
      if (!draft) { setNotice('No saved design on this browser.'); return; }
      if (draft.configurationVersion !== data.configurationVersion) { setError('The available design options changed. Please select them again.'); return; }
      setSelections(validSelections(data, draft.selections || {})); setNotice('Saved design restored.');
    } catch { setError('The saved design could not be restored.'); }
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError('');
    if (!parts.length || previewError || issues.length) { setError('Please wait for a working design preview before submitting.'); return; }
    const body = { productId: data.productId, configurationVersion: data.configurationVersion, selections, contactName: name.trim(), phone: phone.trim(), notes: notes.trim() };
    const hash = JSON.stringify(body);
    if (attempt.current?.hash !== hash) attempt.current = { hash, id: crypto.randomUUID() };
    setSaving(true);
    try {
      const response = await fetch('/api/design-requests', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, requestId: attempt.current.id }) });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || 'Could not submit your design');
      setSubmitted(result);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not submit your design'); }
    finally { setSaving(false); }
  }
  return <>
    <h1 className="text-3xl font-light mb-2">Customize {data.productName}</h1>
    <p className="text-sm text-gray-600 mb-6">{data.categoryName} · Submit your design for a manager’s quote. No payment is collected here.</p>
    <div className="grid lg:grid-cols-2 gap-8">
      <div>
        <ModelPreview url={data.modelUrl} mapping={data.mapping} appearance={appearance} highlight="" solidColor={true} onParts={setParts} onError={setPreviewError} />
        {(previewError || issues.length > 0) && <p role="alert" className="text-red-700 mt-3">{previewError || 'This model’s customization needs an update. Please contact us or choose another product.'}</p>}
        <button className="underline text-sm mt-3" onClick={() => { if (confirm('Reload available options? Save your design first; unsaved choices will reset.')) onReload(); }}>Reload options</button>
      </div>
      <div className="space-y-5">
        {fields.map(f => {
          const enabled = !!data.mapping.regions[f.region]?.targets.length && data[f.list].length > 0;
          return <label className="block" key={f.key}><span className="block text-sm mb-2">{f.label}</span>
            <select className={inputClass} value={selections[f.key]} disabled={!enabled || saving || !!submitted}
              onChange={e => { setSelections(s => ({ ...s, [f.key]: e.target.value })); setNotice(''); }}>
              <option value="">Original design</option>
              {enabled && data[f.list].map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
            </select>
            {!enabled && <span className="text-xs text-gray-500">This area keeps the original design.</span>}
          </label>;
        })}
        <div className="flex gap-5 text-sm"><button onClick={saveDraft}>Save design on this browser</button><button onClick={restoreDraft} disabled={saving || !!submitted}>Restore saved design</button></div>
        {notice && <p role="status">{notice}</p>}
        <p className="text-xs text-gray-500">The 3D preview illustrates your choices. Your manager will confirm the final materials, design feasibility, price and delivery time.</p>
        {submitted ? <div role="status" className="border p-5">
          <p>Design submitted: {submitted.reference}</p><Link className="underline" href={`/custom-designs/${submitted.id}`}>View your design request and quote</Link>
        </div> : <form onSubmit={submit} className="space-y-4 border-t pt-5">
          <h2 className="text-xl">Request a quote</h2>
          <p className="text-sm"><Link className="underline" href={`/login?callbackUrl=${encodeURIComponent(`/product/${data.productId}/customize`)}`}>Sign in</Link> before submitting. You can save your design above before signing in.</p>
          <label className="block text-sm">Contact name<input required maxLength={100} value={name} onChange={e => setName(e.target.value)} className={inputClass} autoComplete="name" /></label>
          <label className="block text-sm">Phone<input required pattern="[6-9][0-9]{9}" maxLength={10} inputMode="tel" title="10-digit Indian mobile number starting with 6–9" value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} autoComplete="tel-national" /></label>
          <label className="block text-sm">Notes for the manager<textarea maxLength={2000} value={notes} onChange={e => setNotes(e.target.value)} className={inputClass} /></label>
          <button disabled={saving || !parts.length || !!previewError || issues.length > 0} className="bg-black text-white px-6 py-3 disabled:opacity-50">{saving ? 'Submitting…' : 'Submit design for quote'}</button>
        </form>}
        {error && <p role="alert" className="text-red-700">{error}</p>}
      </div>
    </div>
  </>;
}
