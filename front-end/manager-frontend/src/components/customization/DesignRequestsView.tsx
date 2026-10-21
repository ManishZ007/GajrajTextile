'use client';
import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { Mapping, Appearance, Option } from './types';
const ModelPreview = dynamic(() => import('./ModelPreview'), { ssr: false });
export type DesignRequest = {
  id: string; reference: string; productName: string; contactName: string; phone: string;
  notes: string; status: string; createdAt: string; version: number;
  quoteAmount: number | null; quoteNotes: string | null; quotedAt: string | null;
  modelUrl?: string; mapping?: Mapping; selections?: Record<string, Option>;
};
type Request = (path: string, quote?: { amount: number; notes: string; version: number }) => Promise<unknown>;
const ignoreParts = () => {};
export default function DesignRequestsView({ id, staff = false, request }: { id?: string; staff?: boolean; request: Request }) {
  const [items, setItems] = useState<DesignRequest[]>([]), [detail, setDetail] = useState<DesignRequest | null>(null);
  const [error, setError] = useState(''), [loading, setLoading] = useState(true), [saving, setSaving] = useState(false);
  const [page, setPage] = useState(0), [pages, setPages] = useState(0), [reload, setReload] = useState(0);
  const [amount, setAmount] = useState(''), [notes, setNotes] = useState(''), [previewError, setPreviewError] = useState('');
  const base = staff ? '/orders/custom-designs' : '/custom-designs';
  useEffect(() => {
    let active = true; setError(''); setLoading(true); setDetail(null);
    request(id ? `/${id}` : `?page=${page}`).then(value => {
      if (!active) return;
      if (id) {
        const d = value as DesignRequest; setDetail(d);
        setAmount(d.quoteAmount == null ? '' : String(d.quoteAmount)); setNotes(d.quoteNotes ?? '');
      } else {
        const d = value as { items: DesignRequest[]; totalPages: number }; setItems(d.items); setPages(d.totalPages);
      }
    }).catch(e => { if (active) setError(e instanceof Error ? e.message : 'Could not load requests'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, page, reload, request]);
  const appearance = useMemo<Appearance>(() => ({
    bodyColor: detail?.selections?.bodyColor?.hexCode ?? '', borderColor: detail?.selections?.borderColor?.hexCode ?? '',
    border: detail?.selections?.border?.url ?? '', padar: detail?.selections?.padar?.url ?? '', butti: detail?.selections?.butti?.url ?? '',
  }), [detail]);
  async function saveQuote(e: React.FormEvent) {
    e.preventDefault(); if (!detail) return;
    setSaving(true); setError('');
    try { await request(`/${detail.id}/quote`, { amount: Number(amount), notes: notes.trim(), version: detail.version }); setReload(v => v + 1); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not save quote'); }
    finally { setSaving(false); }
  }
  const labels: Record<string, string> = { bodyColor: 'Body color', borderColor: 'Border color', padar: 'Padar / Pallu', border: 'Border / Kinar', butti: 'Butti' };
  return <main className="max-w-7xl mx-auto p-6">
    <div className="flex justify-between gap-5 mb-6"><h1 className="text-2xl">{id ? 'Design request' : staff ? 'Customer design requests' : 'My design requests'}</h1>
      <Link className="underline" href={id ? base : staff ? '/orders' : '/customize'}>{id ? 'All design requests' : staff ? 'Orders' : 'Create a design'}</Link></div>
    {error && <p role="alert" className="text-red-700 mb-4">{error}</p>}
    <button className="underline text-sm mb-5" disabled={loading || saving} onClick={() => setReload(v => v + 1)}>Refresh</button>
    {loading ? <p role="status">Loading…</p> : detail ? <>
      <h2 className="text-xl">{detail.reference} · {detail.productName}</h2>
      <p className="my-3">{detail.status === 'QUOTED' ? 'Quote available' : 'Awaiting manager review'} · {new Date(detail.createdAt).toLocaleString()}</p>
      <div className="grid lg:grid-cols-2 gap-8">
        <div>{detail.modelUrl && detail.mapping && <ModelPreview url={detail.modelUrl} mapping={detail.mapping} appearance={appearance} highlight="" solidColor={true} onParts={ignoreParts} onError={setPreviewError} />}
          {previewError && <p role="alert">{previewError}</p>}</div>
        <div className="space-y-4">
          <h3 className="text-lg">Submitted design</h3>
          {Object.entries(labels).map(([key, label]) => <p key={key}>{label}: {detail.selections?.[key]?.name ?? 'Original design'}</p>)}
          <p>Contact: {detail.contactName} · {detail.phone}</p>
          <p className="whitespace-pre-wrap">Customer notes: {detail.notes || 'None'}</p>
          {detail.quoteAmount != null && <div className="border p-4">
            <h3 className="text-lg">Manager quote: {Number(detail.quoteAmount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</h3>
            <p className="whitespace-pre-wrap">{detail.quoteNotes}</p>
          </div>}
          <p className="text-sm text-gray-600">This is a design and quotation request, not a paid production order. Confirm the details with the manager before proceeding.</p>
          {staff && <form onSubmit={saveQuote} className="border-t pt-4 space-y-4">
            <h3 className="text-lg">{detail.quoteAmount == null ? 'Send quote' : 'Update quote'}</h3>
            <label className="block">Total quote (₹)<input className="block border p-2 w-full" required type="number" min="0.01" max="9999999999.99" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} /></label>
            <label className="block">Materials, delivery estimate and terms<textarea className="block border p-2 w-full" maxLength={2000} value={notes} onChange={e => setNotes(e.target.value)} /></label>
            <button className="bg-black text-white px-5 py-2 disabled:opacity-50" disabled={saving}>{saving ? 'Saving…' : 'Save quote for customer'}</button>
          </form>}
        </div>
      </div>
    </> : !id && !error && <>
      {items.length === 0 ? <p>No design requests yet.</p> : <div className="space-y-3">{items.map(d => <Link className="block border p-4" key={d.id} href={`${base}/${d.id}`}>
        <p>{d.reference} · {d.productName}</p><p>{d.contactName} · {d.status === 'QUOTED' ? 'Quote available' : 'Awaiting review'}</p>
        {d.quoteAmount != null && <p>₹{Number(d.quoteAmount).toLocaleString('en-IN')}</p>}
      </Link>)}</div>}
      <div className="flex gap-5 mt-6"><button disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</button><span>Page {page + 1}</span><button disabled={page + 1 >= pages} onClick={() => setPage(p => p + 1)}>Next</button></div>
    </>}
  </main>;
}
