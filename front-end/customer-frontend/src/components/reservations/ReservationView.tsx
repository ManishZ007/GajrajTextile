'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

type Reservation = { id: string; status: string; customerName: string; email: string; phone: string; address: string;
  total: number; paid: number; depositPercent: number; createdAt: string; holdExpiresAt?: string; bankInstructions?: string; note?: string; orderId?: string;
  items: { variantId: string; name: string; variantLabel: string; quantity: number; unitPrice: number }[] };
type Payment = { id: string; status: string; reference: string; claimedAmount: number; verifiedAmount?: number; submittedAt: string; receivedAt?: string; source?: string; hasProof?: boolean; reviewNote?: string };
type Detail = { reservation: Reservation; payments: Payment[]; depositRequired: number; remaining: number; bankConfigured: boolean };
const money = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
const labels: Record<string,string> = { REQUESTED: 'Awaiting manager confirmation', AWAITING_DEPOSIT: 'Awaiting deposit', PAYMENT_REVIEW: 'Payment under review', RESERVED: 'Reserved · balance due', FULLY_PAID: 'Fully paid', CANCELLED: 'Cancelled', EXPIRED: 'Payment window expired' };
const button = 'rounded-full bg-black px-5 py-3 text-sm text-white disabled:opacity-40';
const input = 'w-full rounded-lg border border-black/20 bg-white p-3 text-black';
const panel = 'rounded-xl border border-black/10 bg-white p-6 space-y-4';
async function request(path: string, body?: unknown) {
  const response = await fetch('/api/reservations' + path, { cache: 'no-store', method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? data.message ?? 'Request failed. Please retry.');
  return data;
}
async function proofUrl(path: string) {
  const response = await fetch('/api/reservations' + path, { cache: 'no-store' });
  if (!response.ok) throw new Error('Could not load proof. Please sign in again or retry.');
  return URL.createObjectURL(await response.blob());
}

export default function ReservationView({ id, staff = false }: { id?: string; staff?: boolean }) {
  const base = staff ? '/orders/reservations' : '/reservations';
  const [detail, setDetail] = useState<Detail | null>(null);
  const [rows, setRows] = useState<Reservation[]>([]);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [reason, setReason] = useState('');
  const [reviewAmount, setReviewAmount] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [bankChecked, setBankChecked] = useState(false);
  const [proof, setProof] = useState('');
  const submission = useRef<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      if (id) setDetail(await request('/' + id));
      else { const data = await request('?page=' + page); setRows(data.content); setPages(data.totalPages); }
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load reservations'); }
    finally { setLoading(false); }
  }, [id, page]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => () => { if (proof) URL.revokeObjectURL(proof); }, [proof]);
  const act = async (path: string, body: unknown) => {
    setBusy(true); setError(''); setMessage('');
    try { setDetail(await request('/' + id + path, body)); setMessage('Saved successfully.'); return true; }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to save'); return false; }
    finally { setBusy(false); }
  };
  const upload = async () => {
    if (!file || !['image/png', 'image/jpeg'].includes(file.type) || file.size > 2 * 1024 * 1024) { setError('Choose a PNG or JPEG screenshot under 2 MB.'); return; }
    setBusy(true); setError('');
    try {
      const imageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1]); reader.onerror = reject; reader.readAsDataURL(file);
      });
      submission.current ??= crypto.randomUUID();
      if (await act('/payments', { submissionId: submission.current, amount: Number(amount), reference, imageBase64 })) {
        submission.current = null; setAmount(''); setReference(''); setFile(null);
      }
    } catch { setError('Could not read screenshot. Please choose it again.'); }
    finally { setBusy(false); }
  };
  const preview = async (paymentId: string) => {
    setBusy(true); setError('');
    try { setProof(await proofUrl(`/${id}/payments/${paymentId}/proof`)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not load proof'); }
    finally { setBusy(false); }
  };
  const r = detail?.reservation;
  const pending = detail?.payments.find(p => p.status === 'PENDING');
  useEffect(() => { setReviewAmount(''); setReviewNote(''); setBankChecked(false); }, [pending?.id]);
  return <main className="mx-auto max-w-6xl px-5 py-12 text-[#1b1b1b] space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><p className="text-xs uppercase tracking-widest text-black/50">In-stock reservations</p><h1 className="mt-2 text-3xl">{id ? 'Reservation details' : staff ? 'Customer reservations' : 'My reservations'}</h1></div>
      <div className="flex gap-4 items-center"><Link className="underline" href={id ? base : '/orders'}>{id ? 'All reservations' : 'Orders'}</Link><button className={button} disabled={loading || busy} onClick={() => void load()}>Refresh</button></div>
    </div>
    {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>}
    {message && <p role="status" className="text-green-800">{message}</p>}
    {loading ? <p>Loading reservations…</p> : !id ? <>
      {!rows.length && !error && <p>No in-stock reservations yet.</p>}
      <div className="grid gap-4">{rows.map(row => <Link className={panel + ' block hover:border-black/40'} href={`${base}/${row.id}`} key={row.id}>
        <div className="flex justify-between gap-4"><strong>{staff ? row.customerName : row.items.map(i => i.name).join(', ')}</strong><span>{labels[row.status] ?? row.status}</span></div>
        <p>{money(row.paid)} verified / {money(row.total)} · {row.depositPercent}% initial deposit</p><p className="text-sm text-black/50">Requested {new Date(row.createdAt).toLocaleString()}</p>
      </Link>)}</div>
      <div className="flex gap-4"><button className={button} disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</button><span>Page {page + 1} of {Math.max(1, pages)}</span><button className={button} disabled={page + 1 >= pages} onClick={() => setPage(p => p + 1)}>Next</button></div>
    </> : r && detail && <>
      <section className={panel}>
        <div className="flex justify-between flex-wrap gap-3"><h2 className="text-xl">{labels[r.status] ?? r.status}</h2><span>{r.depositPercent}% initial deposit: {money(detail.depositRequired)}</span></div>
        {r.status === 'REQUESTED' && <p>Our manager will contact you to confirm availability. No payment is needed yet; stock is not held until confirmation.</p>}
        {r.status === 'AWAITING_DEPOSIT' && <p>Submit your deposit proof by <strong>{r.holdExpiresAt && new Date(r.holdExpiresAt).toLocaleString()}</strong>. If you have already transferred after this deadline, contact the manager before sending more money.</p>}
        {r.status === 'PAYMENT_REVIEW' && <p>Your stock stays held while the manager checks the bank credit. The screenshot alone does not confirm payment.</p>}
        {r.status === 'EXPIRED' && <p>The deposit window has ended. Contact the manager if you transferred money; otherwise place a new request subject to availability.</p>}
        <div className="flex justify-between"><span>Verified payments: {money(r.paid)}</span><span>Remaining: {money(detail.remaining)}</span></div>
        <progress aria-label="Verified payment progress" className="w-full accent-black" max={Number(r.total)} value={Number(r.paid)} />
        <p className="text-sm text-black/60">Full verified payment is required before quality checks and dispatch.</p>
        {r.orderId && <Link className="inline-block underline" href={`/orders/${r.orderId}`}>View fulfillment order and delivery progress</Link>}
        {r.status === 'FULLY_PAID' && !r.orderId && <p>Your payment is complete. We are preparing your fulfillment order; refresh shortly.</p>}
        {r.note && <p>Cancellation reason: {r.note}</p>}
      </section>
      <div className="grid gap-6 md:grid-cols-2">
        <section className={panel}><h2 className="text-xl">Items</h2>{r.items.map(i => <div key={i.variantId} className="border-b border-black/10 pb-3"><p>{i.name}</p><p className="text-sm text-black/60">{i.variantLabel} · Quantity {i.quantity} · {money(i.unitPrice)} each</p></div>)}<p className="font-semibold">Total {money(r.total)}</p></section>
        <section className={panel}><h2 className="text-xl">Customer & delivery</h2><p>{r.customerName}</p><p>{r.email} · {r.phone}</p><p>{r.address}</p></section>
      </div>
      {staff && r.status === 'REQUESTED' && <section className={panel}><h2 className="text-xl">Confirm after contacting the customer</h2><p>Confirmation checks current stock and starts a 24-hour deposit window.</p><p>Send the payment QR code or instructions to the customer manually through WhatsApp.</p><button className={button} disabled={busy} onClick={() => void act('/confirm', {})}>Confirm & hold stock</button></section>}
      {r.bankInstructions && !['CANCELLED','EXPIRED','FULLY_PAID'].includes(r.status) && <section className={panel}><h2 className="text-xl">Payment instructions</h2><pre className="whitespace-pre-wrap font-sans">{r.bankInstructions}</pre><p className="text-sm">Use the bank transaction reference when submitting proof. Payments count only after the manager checks the bank credit.</p></section>}
      {!r.bankInstructions && !['REQUESTED','CANCELLED','EXPIRED','FULLY_PAID'].includes(r.status) && <section className={panel}><h2 className="text-xl">Payment instructions</h2><p>Your manager will share a payment QR code through WhatsApp. After paying, send the transaction reference to your manager or upload proof here. Only verified payments count toward your balance.</p></section>}
      <section className={panel}><h2 className="text-xl">Payment history</h2>{!detail.payments.length && <p>No payment proof submitted yet.</p>}{detail.payments.map(p => <article key={p.id} className="border-t border-black/10 pt-4 space-y-2">
        <div className="flex justify-between flex-wrap gap-2"><strong>{p.status === 'VERIFIED' ? 'Verified' : p.status === 'REJECTED' ? 'Rejected' : 'Under review'}</strong><span>{new Date(p.submittedAt).toLocaleString()}</span></div>
        <p>Reference: {p.reference}</p><p>Submitted {money(p.claimedAmount)}{p.verifiedAmount != null && ` · Verified ${money(p.verifiedAmount)}`}</p>{p.reviewNote && <p>Manager note: {p.reviewNote}</p>}
        {p.hasProof && <button className="underline" disabled={busy} onClick={() => void preview(p.id)}>View payment screenshot</button>}{p.source === 'MANAGER' && <p className="text-sm text-black/60">Recorded by manager · Received {p.receivedAt && new Date(p.receivedAt).toLocaleString()}</p>}
      </article>)}</section>
      {proof && <section className={panel}><button className="underline" onClick={() => setProof('')}>Close screenshot</button>{/* eslint-disable-next-line @next/next/no-img-element */}<img className="max-h-[600px] max-w-full object-contain" src={proof} alt="Submitted payment screenshot" /></section>}
      {staff && pending && <form className={panel} onSubmit={e => { e.preventDefault(); if (bankChecked) void act(`/payments/${pending.id}/review`, { approved: true, amount: Number(reviewAmount), note: reviewNote }); }}>
        <h2 className="text-xl">Verify bank credit</h2><p>Check the actual payment receipt and transaction reference before approving. Do not rely on the screenshot alone.</p>
        <label className="block">Amount actually credited (₹)<input className={input} type="number" step="0.01" min="0.01" max={detail.remaining} required value={reviewAmount} onChange={e => setReviewAmount(e.target.value)} /></label>
        <label className="block">Verification / rejection note<textarea className={input} required maxLength={1000} value={reviewNote} onChange={e => setReviewNote(e.target.value)} /></label>
        <label className="flex gap-3"><input type="checkbox" checked={bankChecked} onChange={e => setBankChecked(e.target.checked)} />I verified that this payment was actually received.</label>
        <div className="flex gap-3"><button className={button} disabled={busy || !bankChecked}>Approve verified payment</button><button type="button" className={button} disabled={busy || !reviewNote.trim()} onClick={() => void act(`/payments/${pending.id}/review`, { approved: false, note: reviewNote })}>Reject proof</button></div>
      </form>}
      {!staff && !pending && ['AWAITING_DEPOSIT','RESERVED'].includes(r.status) && <form className={panel} onSubmit={e => { e.preventDefault(); void upload(); }}>
        <h2 className="text-xl">Submit bank transfer proof</h2><p>Initial payment must be at least {money(detail.depositRequired)}. Subsequent payments may cover any amount up to your remaining balance.</p>
        <label className="block">Amount transferred (₹)<input className={input} type="number" min={Number(r.paid) === 0 ? detail.depositRequired : 0.01} max={detail.remaining} step="0.01" required value={amount} onChange={e => setAmount(e.target.value)} /></label>
        <label className="block">Bank transaction reference<input className={input} required minLength={6} maxLength={100} value={reference} onChange={e => setReference(e.target.value)} /></label>
        <label className="block">Screenshot (PNG / JPEG, up to 2 MB)<input className={input} type="file" accept="image/png,image/jpeg" required onChange={e => setFile(e.target.files?.[0] ?? null)} /></label>
        <button className={button} disabled={busy}>Submit for review</button>
      </form>}
      {Number(r.paid) === 0 && !pending && ['REQUESTED','AWAITING_DEPOSIT','EXPIRED'].includes(r.status) && <form className={panel} onSubmit={e => { e.preventDefault(); void act('/cancel', { reason }); }}><h2 className="text-xl">Cancel request</h2><p>The cancellation stays in your history and releases any stock held.</p><label className="block">Reason<textarea className={input} required maxLength={1000} value={reason} onChange={e => setReason(e.target.value)} /></label><button className={button} disabled={busy}>Cancel reservation</button></form>}
    </>}
  </main>;
}
