'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ChevronRight, Loader2, RefreshCw, X } from 'lucide-react';

type Reservation = { id: string; status: string; customerName: string; email: string; phone: string; address: string;
  total: number; paid: number; depositPercent: number; createdAt: string; holdExpiresAt?: string; bankInstructions?: string; note?: string; orderId?: string;
  items: { variantId: string; name: string; variantLabel: string; quantity: number; unitPrice: number }[] };
type Payment = { id: string; status: string; reference: string; claimedAmount: number; verifiedAmount?: number; submittedAt: string; receivedAt?: string; source?: string; hasProof?: boolean; reviewNote?: string };
type Detail = { reservation: Reservation; payments: Payment[]; depositRequired: number; remaining: number; bankConfigured: boolean; production?: { status?: string; workerName?: string; quality?: string; orderNumber?: string; shipped?: boolean } };
const money = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
const labels: Record<string,string> = { REQUESTED: 'Awaiting manager confirmation', AWAITING_DEPOSIT: 'Awaiting deposit', PAYMENT_REVIEW: 'Payment under review', RESERVED: 'Reserved · balance due', FULLY_PAID: 'Fully paid', CANCELLED: 'Cancelled', EXPIRED: 'Payment window expired' };
const fmtDate = (iso?: string) => iso ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const button = 'bg-black rounded-full text-white text-[0.725rem] tracking-[1.5px] uppercase px-8 py-3.5 hover:opacity-80 transition-opacity duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer';
const outlineButton = 'border border-black rounded-full text-[#1B1B1B] text-[0.725rem] tracking-[1.5px] uppercase px-8 py-3.5 hover:opacity-60 transition-opacity duration-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer';
const textLink = 'text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B] border-b border-[#1B1B1B]/30 pb-px hover:border-[#1B1B1B] transition-colors duration-200 cursor-pointer disabled:opacity-40';
const labelText = 'block text-[0.7rem] tracking-[1.5px] uppercase text-[#1B1B1B]/75 mb-2';
const input = 'w-full border-b border-black/15 bg-transparent text-[13.5px] font-light text-[#1B1B1B] pb-3 pt-1 outline-none focus:border-[#1B1B1B] placeholder:text-[#1B1B1B]/25 transition-colors duration-200';
const body = 'text-[13px] font-light text-[#1B1B1B]/60 leading-[1.8]';
const small = 'text-[12px] font-light text-[#1B1B1B]/45 leading-[1.7]';
const badge = 'text-[0.65rem] tracking-[1.5px] uppercase border border-black/30 px-2.5 py-1 text-[#1B1B1B]/75 shrink-0';

function Section({ title, children, as = 'section', onSubmit }: { title: string; children: React.ReactNode; as?: 'section' | 'form'; onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void }) {
  const Tag = as;
  return <Tag onSubmit={onSubmit} className="border-t border-black/8 pt-6 flex flex-col gap-5">
    <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/75">{title}</p>
    {children}
  </Tag>;
}

function Meta({ label, value }: { label: string; value: string }) {
  return <div>
    <p className="text-[0.65rem] tracking-[1.5px] uppercase text-[#1B1B1B]/45 mb-1">{label}</p>
    <p className="text-[13px] font-light text-[#1B1B1B]">{value}</p>
  </div>;
}

function PaidBar({ paid, total }: { paid: number; total: number }) {
  const pct = total > 0 ? Math.min(100, (Number(paid) / Number(total)) * 100) : 0;
  return <div role="progressbar" aria-label="Verified payment progress" aria-valuemin={0} aria-valuemax={Number(total)} aria-valuenow={Number(paid)} className="h-px w-full bg-black/10 relative">
    <div className="absolute left-0 top-[-1px] h-[3px] bg-[#1B1B1B] transition-all duration-500" style={{ width: `${pct}%` }} />
  </div>;
}
async function transport(path: string, body?: unknown, outOfStock = false) {
  const response = await fetch('/api/reservations' + (outOfStock ? '/out-of-stock' : '') + path, { cache: 'no-store', method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? data.message ?? 'Request failed. Please retry.');
  return data;
}
async function proofUrl(path: string, outOfStock = false) {
  const response = await fetch('/api/reservations' + (outOfStock ? '/out-of-stock' : '') + path, { cache: 'no-store' });
  if (!response.ok) throw new Error('Could not load proof. Please sign in again or retry.');
  return URL.createObjectURL(await response.blob());
}

export default function ReservationView({ id, staff = false, outOfStock = false }: { id?: string; staff?: boolean; outOfStock?: boolean }) {
  const base = staff ? (outOfStock ? '/orders/out-of-stock-reservations' : '/orders/reservations') : (outOfStock ? '/reservations/out-of-stock' : '/reservations');
  const request = useCallback((path: string, body?: unknown) => transport(path, body, outOfStock), [outOfStock]);
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
  }, [id, page, request]);
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
    try { setProof(await proofUrl(`/${id}/payments/${paymentId}/proof`, outOfStock)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not load proof'); }
    finally { setBusy(false); }
  };
  const r = detail?.reservation;
  const pending = detail?.payments.find(p => p.status === 'PENDING');
  useEffect(() => { setReviewAmount(''); setReviewNote(''); setBankChecked(false); }, [pending?.id]);
  const title = id ? 'Reservation details' : staff ? 'Customer reservations' : 'My reservations';
  return <div className="min-h-screen bg-white flex flex-col">
    {/* Hero */}
    <section className="px-6 md:px-12 lg:px-16 pt-14 pb-12 border-b border-black/8">
      <Link href={id ? base : '/orders'} className="inline-flex items-center gap-1.5 text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/65 hover:text-[#1B1B1B]/95 transition-colors mb-6">
        <ArrowLeft size={11} strokeWidth={1.5} />
        {id ? 'All reservations' : 'My orders'}
      </Link>
      <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95 mb-4">{outOfStock ? 'Made for you' : 'In-stock reservations'}</p>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <h1 className="font-light text-[#1B1B1B] leading-[1.08] tracking-[-0.02em]" style={{ fontSize: 'clamp(1.5rem, 4vw, 3rem)' }}>{title}</h1>
        <div className="flex items-center gap-4 mt-1">
          {r && <span className={badge}>{labels[r.status] ?? r.status}</span>}
          <button className={textLink} disabled={loading || busy} onClick={() => void load()}>
            <span className="inline-flex items-center gap-1.5"><RefreshCw size={10} strokeWidth={1.5} className={loading ? 'animate-spin' : ''} />Refresh</span>
          </button>
        </div>
      </div>
      {!id && <div className="flex gap-6 mt-6">
        {[
          { href: staff ? '/orders/reservations' : '/reservations', label: 'In stock', active: !outOfStock },
          { href: staff ? '/orders/out-of-stock-reservations' : '/reservations/out-of-stock', label: 'Made for you', active: outOfStock },
        ].map(tab =>
          <Link key={tab.href} href={tab.href}
            className={`text-[0.725rem] tracking-[1.5px] uppercase pb-1.5 border-b transition-colors ${tab.active ? 'text-[#1B1B1B] border-[#1B1B1B]' : 'text-[#1B1B1B]/40 border-transparent hover:text-[#1B1B1B]/75'}`}>
            {tab.label}
          </Link>)}
      </div>}
    </section>

    <div className="flex-1 w-full max-w-4xl px-6 md:px-12 lg:px-16 py-10 flex flex-col gap-8">
      {error && <div role="alert" className="border border-red-200 bg-red-50 px-4 py-3"><p className="text-[12.5px] text-red-600 font-light">{error}</p></div>}
      {message && <div role="status" className="border border-black/10 px-4 py-3"><p className="text-[12.5px] text-[#1B1B1B]/75 font-light">{message}</p></div>}

      {loading ? <div className="py-20 flex justify-center"><Loader2 size={18} strokeWidth={1.5} className="animate-spin text-[#1B1B1B]/30" /></div>
      : !id ? <>
        {!rows.length && !error && <div className="py-16 flex flex-col gap-5 border-t border-black/8">
          <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/35">No reservations</p>
          <p className={body + ' max-w-sm'}>{outOfStock ? 'When you ask us to make a sold-out saree for you, it will appear here.' : 'Reservations you request at checkout will appear here.'}</p>
          <Link href="/collections/paithani" className={button + ' w-fit'}>Browse collections</Link>
        </div>}
        {rows.length > 0 && <div className="border-t border-black/8">{rows.map(row =>
          <Link href={`${base}/${row.id}`} key={row.id} className="group border-b border-black/8 py-6 flex items-start gap-6">
            <div className="flex-1 min-w-0">
              <p className="text-[13.5px] font-light text-[#1B1B1B]/95 mb-1.5 truncate">{staff ? row.customerName : row.items.map(i => i.name).join(', ')}</p>
              <p className="text-[12px] font-light text-[#1B1B1B]/60 mb-3">{money(row.paid)} paid of {money(row.total)} · {row.depositPercent}% deposit</p>
              <div className="max-w-xs mb-3"><PaidBar paid={row.paid} total={row.total} /></div>
              <p className="text-[11px] text-[#1B1B1B]/40">Requested {fmtDate(row.createdAt)}</p>
            </div>
            <div className="flex flex-col items-end gap-3 shrink-0">
              <span className={badge}>{labels[row.status] ?? row.status}</span>
              <ChevronRight size={14} strokeWidth={1.5} className="text-[#1B1B1B]/20 group-hover:text-[#1B1B1B]/60 transition-colors" />
            </div>
          </Link>)}
        </div>}
        {pages > 1 && <div className="flex items-center gap-6">
          <button className={textLink} disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</button>
          <span className="text-[0.725rem] tracking-[1.5px] text-[#1B1B1B]/45">{page + 1} / {Math.max(1, pages)}</span>
          <button className={textLink} disabled={page + 1 >= pages} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>}
      </> : r && detail && <>
        {/* Status + payment summary */}
        <div className="flex flex-col gap-5">
          <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/75">Status</p>
          <p className="font-light text-[#1B1B1B] leading-[1.15]" style={{ fontSize: 'clamp(1.2rem, 2.4vw, 1.7rem)' }}>{labels[r.status] ?? r.status}</p>
          {r.status === 'REQUESTED' && <p className={body}>Our manager will contact you before confirming. No payment is needed until confirmation.</p>}
          {r.status === 'AWAITING_DEPOSIT' && <p className={body}>Submit your deposit proof by <span className="text-[#1B1B1B]">{fmtDate(r.holdExpiresAt)}</span>. If you have already transferred after this deadline, contact the manager before sending more money.</p>}
          {r.status === 'PAYMENT_REVIEW' && <p className={body}>Your request remains open during payment review. Production or stock commitment starts only after the manager verifies the deposit.</p>}
          {r.status === 'EXPIRED' && <p className={body}>The deposit window has ended. Contact the manager if you transferred money; otherwise place a new request subject to availability.</p>}
          {r.status === 'FULLY_PAID' && !r.orderId && <p className={body}>Your payment is complete. We are preparing your fulfillment order; refresh shortly.</p>}
          {r.note && <p className={body}>Cancellation reason: <span className="text-[#1B1B1B]">{r.note}</span></p>}

          <div className="flex flex-col gap-3 pt-2">
            <PaidBar paid={r.paid} total={r.total} />
            <div className="grid grid-cols-3 gap-4">
              <div><p className="text-[0.65rem] tracking-[1.5px] uppercase text-[#1B1B1B]/45 mb-1">Verified</p><p className="text-[14px] font-light text-[#1B1B1B]">{money(r.paid)}</p></div>
              <div><p className="text-[0.65rem] tracking-[1.5px] uppercase text-[#1B1B1B]/45 mb-1">Remaining</p><p className="text-[14px] font-light text-[#1B1B1B]">{money(detail.remaining)}</p></div>
              <div><p className="text-[0.65rem] tracking-[1.5px] uppercase text-[#1B1B1B]/45 mb-1">{r.depositPercent}% deposit</p><p className="text-[14px] font-light text-[#1B1B1B]">{money(detail.depositRequired)}</p></div>
            </div>
          </div>
          <p className={small}>Full verified payment and passed quality checks are required before dispatch.</p>
          {r.orderId && <Link className={textLink + ' w-fit'} href={`/orders/${r.orderId}`}>View order &amp; delivery progress</Link>}
        </div>

        {outOfStock && <Section title="Made for you">
          <div className="grid grid-cols-2 gap-x-8 gap-y-5">
            <Meta label="Production order" value={detail.production?.orderNumber ?? 'Starts after deposit verification'} />
            <Meta label="Production" value={detail.production?.status?.replaceAll('_', ' ') ?? 'Awaiting verified deposit'} />
            {detail.production?.workerName && <Meta label="Weaver" value={detail.production.workerName} />}
            <Meta label="Quality" value={detail.production?.quality ?? 'Pending'} />
          </div>
          <p className={small}>No available inventory is deducted. Your saree is woven specifically for this reservation.</p>
        </Section>}

        <Section title={r.items.length > 1 ? `Items (${r.items.length})` : 'Item'}>
          <div className="flex flex-col">
            {r.items.map((i, idx) => <div key={i.variantId} className={`flex items-start justify-between gap-4 py-4 ${idx < r.items.length - 1 ? 'border-b border-black/8' : ''}`}>
              <div><p className="text-[13.5px] font-light text-[#1B1B1B] mb-1">{i.name}</p><p className="text-[12px] font-light text-[#1B1B1B]/55">{i.variantLabel} · Qty {i.quantity} · {money(i.unitPrice)} each</p></div>
              <p className="text-[13.5px] font-light text-[#1B1B1B] shrink-0">{money(i.unitPrice * i.quantity)}</p>
            </div>)}
          </div>
          <div className="flex justify-between items-baseline border-t border-black/8 pt-4">
            <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/75">Total</p>
            <p className="text-[1.2rem] font-light text-[#1B1B1B]">{money(r.total)}</p>
          </div>
        </Section>

        <Section title="Customer & delivery">
          <div>
            <p className="text-[13.5px] font-light text-[#1B1B1B] mb-1">{r.customerName}</p>
            <p className="text-[13px] font-light text-[#1B1B1B]/65">{r.email} · {r.phone}</p>
            <p className="text-[13px] font-light text-[#1B1B1B]/65 mt-1">{r.address}</p>
          </div>
        </Section>

        {staff && r.status === 'REQUESTED' && <Section title="Confirm after contacting the customer">
          <p className={body}>Confirmation starts a 24-hour deposit window. For remade products, worker assignment becomes available after deposit verification. Send the payment QR code or instructions to the customer manually through WhatsApp.</p>
          <button className={button + ' w-fit'} disabled={busy} onClick={() => void act('/confirm', {})}>{outOfStock ? 'Confirm remake request' : 'Confirm & hold stock'}</button>
        </Section>}

        {r.bankInstructions && !['CANCELLED','EXPIRED','FULLY_PAID'].includes(r.status) && <Section title="Payment instructions">
          <pre className="whitespace-pre-wrap font-sans text-[13px] font-light text-[#1B1B1B] leading-[1.8] border-l border-black/15 pl-4">{r.bankInstructions}</pre>
          <p className={small}>Use the bank transaction reference when submitting proof. Payments count only after the manager checks the bank credit.</p>
        </Section>}
        {!r.bankInstructions && !['REQUESTED','CANCELLED','EXPIRED','FULLY_PAID'].includes(r.status) && <Section title="Payment instructions">
          <p className={body}>Your manager will share a payment QR code through WhatsApp. After paying, send the transaction reference to your manager or upload proof here. Only verified payments count toward your balance.</p>
        </Section>}

        <Section title="Payment history">
          {!detail.payments.length && <p className={small}>No payment proof submitted yet.</p>}
          {detail.payments.length > 0 && <div className="flex flex-col">{detail.payments.map((p, idx) => <article key={p.id} className={`py-4 flex flex-col gap-1.5 ${idx < detail.payments.length - 1 ? 'border-b border-black/8' : ''}`}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span className={badge}>{p.status === 'VERIFIED' ? 'Verified' : p.status === 'REJECTED' ? 'Rejected' : 'Under review'}</span>
              <span className="text-[11px] text-[#1B1B1B]/40">{fmtDate(p.submittedAt)}</span>
            </div>
            <p className="text-[13.5px] font-light text-[#1B1B1B] mt-1">{money(p.claimedAmount)} submitted{p.verifiedAmount != null && <span className="text-[#1B1B1B]/55"> · {money(p.verifiedAmount)} verified</span>}</p>
            <p className="text-[11.5px] font-light text-[#1B1B1B]/45 font-mono">Ref {p.reference}</p>
            {p.reviewNote && <p className="text-[12px] font-light text-[#1B1B1B]/60">Manager note: {p.reviewNote}</p>}
            {p.source === 'MANAGER' && <p className={small}>Recorded by manager · Received {fmtDate(p.receivedAt)}</p>}
            {p.hasProof && <button className={textLink + ' w-fit mt-1'} disabled={busy} onClick={() => void preview(p.id)}>View screenshot</button>}
          </article>)}</div>}
        </Section>

        {proof && <section className="border-t border-black/8 pt-6 flex flex-col gap-4">
          <button className="self-end text-[#1B1B1B]/50 hover:text-[#1B1B1B] cursor-pointer" aria-label="Close screenshot" onClick={() => setProof('')}><X size={16} strokeWidth={1.5} /></button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="max-h-[600px] max-w-full object-contain mx-auto" src={proof} alt="Submitted payment screenshot" />
        </section>}

        {staff && pending && <Section as="form" title="Verify bank credit" onSubmit={e => { e.preventDefault(); if (bankChecked) void act(`/payments/${pending.id}/review`, { approved: true, amount: Number(reviewAmount), note: reviewNote }); }}>
          <p className={body}>Check the actual payment receipt and transaction reference before approving. Do not rely on the screenshot alone.</p>
          <label><span className={labelText}>Amount actually credited (₹)</span><input className={input} type="number" step="0.01" min="0.01" max={detail.remaining} required value={reviewAmount} onChange={e => setReviewAmount(e.target.value)} /></label>
          <label><span className={labelText}>Verification / rejection note</span><textarea className={input + ' resize-none'} rows={2} required maxLength={1000} value={reviewNote} onChange={e => setReviewNote(e.target.value)} /></label>
          <label className="flex items-start gap-3 text-[13px] font-light text-[#1B1B1B]/75 cursor-pointer"><input type="checkbox" className="mt-1 accent-black" checked={bankChecked} onChange={e => setBankChecked(e.target.checked)} />I verified that this payment was actually received.</label>
          <div className="flex gap-3 flex-wrap"><button className={button} disabled={busy || !bankChecked}>Approve payment</button><button type="button" className={outlineButton} disabled={busy || !reviewNote.trim()} onClick={() => void act(`/payments/${pending.id}/review`, { approved: false, note: reviewNote })}>Reject proof</button></div>
        </Section>}

        {!staff && !pending && ['AWAITING_DEPOSIT','RESERVED'].includes(r.status) && <Section as="form" title="Submit bank transfer proof" onSubmit={e => { e.preventDefault(); void upload(); }}>
          <p className={body}>Initial payment must be at least <span className="text-[#1B1B1B]">{money(detail.depositRequired)}</span>. Later payments may cover any amount up to your remaining balance.</p>
          <div className="grid gap-7 md:grid-cols-2">
            <label><span className={labelText}>Amount transferred (₹)</span><input className={input} type="number" min={Number(r.paid) === 0 ? detail.depositRequired : 0.01} max={detail.remaining} step="0.01" required placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} /></label>
            <label><span className={labelText}>Transaction reference</span><input className={input} required minLength={6} maxLength={100} placeholder="UTR / reference no." value={reference} onChange={e => setReference(e.target.value)} /></label>
          </div>
          <label className="block">
            <span className={labelText}>Payment screenshot</span>
            <input className="w-full text-[12px] font-light text-[#1B1B1B]/55 file:mr-4 file:rounded-full file:border file:border-black file:bg-white file:px-5 file:py-2 file:text-[0.65rem] file:tracking-[1.5px] file:uppercase file:text-[#1B1B1B] file:cursor-pointer hover:file:opacity-60" type="file" accept="image/png,image/jpeg" required onChange={e => setFile(e.target.files?.[0] ?? null)} />
            <span className={small + ' block mt-2'}>PNG or JPEG, up to 2 MB.</span>
          </label>
          <button className={button + ' w-full md:w-fit mt-2'} disabled={busy}>{busy ? 'Submitting…' : 'Submit for review'}</button>
        </Section>}

        {Number(r.paid) === 0 && !pending && ['REQUESTED','AWAITING_DEPOSIT','EXPIRED'].includes(r.status) && <Section as="form" title="Cancel request" onSubmit={e => { e.preventDefault(); void act('/cancel', { reason }); }}>
          <p className={body}>The cancellation stays in your history and releases any stock held.</p>
          <label><span className={labelText}>Reason</span><textarea className={input + ' resize-none'} rows={2} required maxLength={1000} placeholder="Tell us why you are cancelling" value={reason} onChange={e => setReason(e.target.value)} /></label>
          <button className={outlineButton + ' w-full md:w-fit'} disabled={busy}>Cancel reservation</button>
        </Section>}
      </>}
    </div>
  </div>;
}
