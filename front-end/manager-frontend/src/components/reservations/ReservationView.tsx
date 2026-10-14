'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api/apiFetch';
import { IconChevronLeft, IconChevronRight, IconLoader } from '@/providers/Icons';
import { useCallback, useEffect, useRef, useState } from 'react';

type Reservation = { id: string; status: string; customerName: string; email: string; phone: string; address: string;
  total: number; paid: number; depositPercent: number; createdAt: string; holdExpiresAt?: string; bankInstructions?: string; note?: string; orderId?: string;
  items: { variantId: string; name: string; variantLabel: string; quantity: number; unitPrice: number }[] };
type Payment = { id: string; status: string; reference: string; claimedAmount: number; verifiedAmount?: number; submittedAt: string; receivedAt?: string; source?: string; hasProof?: boolean; reviewNote?: string };
type Detail = { reservation: Reservation; payments: Payment[]; depositRequired: number; remaining: number; bankConfigured: boolean; production?: { status?: string; workerName?: string; quality?: string; orderNumber?: string; shipped?: boolean } };
const money = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
const labels: Record<string,string> = { REQUESTED: 'Awaiting manager confirmation', AWAITING_DEPOSIT: 'Awaiting deposit', PAYMENT_REVIEW: 'Payment under review', RESERVED: 'Reserved · balance due', FULLY_PAID: 'Fully paid', CANCELLED: 'Cancelled', EXPIRED: 'Payment window expired' };
const statusBadge: Record<string,string> = {
  REQUESTED: 'bg-amber-100 text-amber-700',
  AWAITING_DEPOSIT: 'bg-orange-100 text-orange-700',
  PAYMENT_REVIEW: 'bg-blue-100 text-blue-700',
  RESERVED: 'bg-indigo-100 text-indigo-700',
  FULLY_PAID: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-600',
  EXPIRED: 'bg-gray-100 text-gray-600',
};
const paymentBadge: Record<string,string> = { VERIFIED: 'bg-green-100 text-green-700', REJECTED: 'bg-red-100 text-red-600' };
const button = 'inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed';
const secondary = 'inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-gray-200 bg-white/60 text-sm font-medium text-gray-600 rounded-xl hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed';
const danger = 'inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-red-200 bg-red-50 text-sm font-medium text-red-600 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed';
const input = 'mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors';
const label = 'block text-xs font-medium text-gray-500';
const checkLabel = 'flex items-start gap-2.5 text-sm text-gray-600';
const panel = 'bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl p-5 space-y-3 text-sm text-gray-700';
const heading = 'text-sm font-semibold text-gray-800';
const muted = 'text-xs text-gray-400';
const badge = 'inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap';
async function transport(path: string, body?: unknown, outOfStock = false) {
  return apiFetch('http://localhost:8083/manager/reservations/' + (outOfStock ? 'out-of-stock' : 'in-stock') + path, { method: body === undefined ? 'GET' : 'POST', body: body === undefined ? undefined : JSON.stringify(body) });
}
async function proofUrl(path: string, outOfStock = false) {
  const response = await fetch('http://localhost:8083/manager/reservations/' + (outOfStock ? 'out-of-stock' : 'in-stock') + path, { cache: 'no-store', credentials: 'include', headers: { Authorization: `Bearer ${localStorage.getItem('access_token') ?? ''}` } });
  if (!response.ok) throw new Error('Could not load proof. Please sign in again or retry.');
  return URL.createObjectURL(await response.blob());
}
function Row({ name, children }: { name: string; children: React.ReactNode }) {
  return <div className="flex justify-between gap-4 py-1.5 border-b border-gray-100 last:border-0"><span className="text-gray-400">{name}</span><span className="text-right text-gray-800">{children}</span></div>;
}
export default function ReservationView({ id, staff = false, outOfStock = false }: { id?: string; staff?: boolean; outOfStock?: boolean }) {
  const router = useRouter();
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
  const [workerOptions, setWorkerOptions] = useState<{ id: string; name: string }[]>([]);
  const [workerPage, setWorkerPage] = useState(0);
  const [workerPages, setWorkerPages] = useState(0);
  const [workerId, setWorkerId] = useState('');
  const [productionNote, setProductionNote] = useState('');
  const [receivedAmount, setReceivedAmount] = useState('');
  const [receivedReference, setReceivedReference] = useState('');
  const [receivedDate, setReceivedDate] = useState('');
  const [receivedNote, setReceivedNote] = useState('');
  const [receiptChecked, setReceiptChecked] = useState(false);
  const receivedId = useRef<string | null>(null);
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
  useEffect(() => {
    if (!outOfStock || !staff || !id) return;
    apiFetch(`http://localhost:8084/manger-worker/all?status=APPROVED&page=${workerPage}&size=20`).then(data => {
      setWorkerPages(data.totalPages ?? 0);
      setWorkerOptions((data.workers ?? []).map((entry: { worker: { workerId: string; workerCode: number }; user?: { auth?: { fullName?: string } } }) => ({ id: entry.worker.workerId, name: `${entry.user?.auth?.fullName ?? 'Worker'} · ${entry.worker.workerCode}` })));
    }).catch(() => setError('Could not load workers. Check Worker service availability and refresh.'));
  }, [outOfStock, staff, id, workerPage]);
  const productionAction = async (action: string) => {
    setBusy(true); setError('');
    try { await request(`/${id}/production`, { action, workerId, note: productionNote }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not update production'); }
    finally { setBusy(false); }
  };
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
  const recordReceived = async () => {
    if (!receiptChecked || !receivedDate) return;
    receivedId.current ??= crypto.randomUUID();
    if (await act('/received-payments', { submissionId: receivedId.current, amount: Number(receivedAmount), reference: receivedReference,
      receivedAt: new Date(receivedDate).toISOString(), note: receivedNote })) {
      receivedId.current = null; setReceivedAmount(''); setReceivedReference(''); setReceivedDate(''); setReceivedNote(''); setReceiptChecked(false);
    }
  };
  const pending = detail?.payments.find(p => p.status === 'PENDING');
  useEffect(() => { setReviewAmount(''); setReviewNote(''); setBankChecked(false); }, [pending?.id]);
  const paidPercent = r && Number(r.total) > 0 ? Math.min(100, (Number(r.paid) / Number(r.total)) * 100) : 0;
  const statusPill = (status: string) => <span className={`${badge} ${statusBadge[status] ?? 'bg-gray-100 text-gray-600'}`}>{labels[status] ?? status}</span>;

  return <div className="flex flex-col gap-5">
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{outOfStock ? 'Out-of-stock reservations' : 'In-stock reservations'}</p>
        <h1 className="text-2xl font-semibold text-gray-800">{id ? 'Reservation details' : staff ? 'Customer reservations' : 'My reservations'}</h1>
      </div>
      <div className="flex items-center gap-2">
        <Link className={secondary} href={id ? base : '/orders'}><IconChevronLeft />{id ? 'All reservations' : 'Orders'}</Link>
        <button className={button} disabled={loading || busy} onClick={() => void load()}>{(loading || busy) && <IconLoader />}Refresh</button>
      </div>
    </div>

    {error && <p role="alert" className="text-sm text-red-500 bg-red-50 border border-red-100 px-4 py-3 rounded-xl">{error}</p>}
    {message && <p role="status" className="text-sm text-green-700 bg-green-50 border border-green-100 px-4 py-3 rounded-xl">{message}</p>}

    {loading ? <div className="flex items-center justify-center h-40 gap-2 text-gray-400"><IconLoader /><span className="text-sm">Loading reservations…</span></div> : !id ? <>
      <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl overflow-hidden">
        {!rows.length && !error ? <div className="flex items-center justify-center h-40 text-sm text-gray-400">No reservations in this category yet.</div> :
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100">
              {[staff ? 'Customer' : 'Items', 'Status', 'Verified / Total', 'Deposit', 'Requested'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>)}
            </tr></thead>
            <tbody>{rows.map(row => <tr key={row.id} onClick={() => router.push(`${base}/${row.id}`)} className="border-t border-gray-50 hover:bg-white/50 transition-colors cursor-pointer">
              <td className="px-4 py-3"><Link href={`${base}/${row.id}`} onClick={e => e.stopPropagation()} className="font-medium text-gray-800 hover:underline">{staff ? row.customerName : row.items.map(i => i.name).join(', ')}</Link></td>
              <td className="px-4 py-3">{statusPill(row.status)}</td>
              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{money(row.paid)} <span className="text-gray-400">/ {money(row.total)}</span></td>
              <td className="px-4 py-3 text-gray-500">{row.depositPercent}%</td>
              <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{new Date(row.createdAt).toLocaleString()}</td>
            </tr>)}</tbody>
          </table></div>}
      </div>
      <div className="flex items-center justify-between">
        <span className={muted}>Page {page + 1} of {Math.max(1, pages)}</span>
        <div className="flex gap-2">
          <button className={secondary} disabled={page === 0} onClick={() => setPage(p => p - 1)}><IconChevronLeft />Previous</button>
          <button className={secondary} disabled={page + 1 >= pages} onClick={() => setPage(p => p + 1)}>Next<IconChevronRight /></button>
        </div>
      </div>
    </> : r && detail && <>
      <section className={panel}>
        <div className="flex justify-between items-center flex-wrap gap-3">{statusPill(r.status)}<span className="text-gray-500">{r.depositPercent}% initial deposit: <strong className="text-gray-800">{money(detail.depositRequired)}</strong></span></div>
        {r.status === 'REQUESTED' && <p>Our manager will contact you before confirming. No payment is needed until confirmation.</p>}
        {r.status === 'AWAITING_DEPOSIT' && <p>Submit your deposit proof by <strong>{r.holdExpiresAt && new Date(r.holdExpiresAt).toLocaleString()}</strong>. If you have already transferred after this deadline, contact the manager before sending more money.</p>}
        {r.status === 'PAYMENT_REVIEW' && <p>Your request remains open during payment review. Production or stock commitment starts only after the manager verifies the deposit.</p>}
        {r.status === 'EXPIRED' && <p>The deposit window has ended. Contact the manager if you transferred money; otherwise place a new request subject to availability.</p>}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/60 rounded-xl px-3 py-2.5"><p className={muted}>Total</p><p className="text-base font-semibold text-gray-800">{money(r.total)}</p></div>
          <div className="bg-white/60 rounded-xl px-3 py-2.5"><p className={muted}>Verified paid</p><p className="text-base font-semibold text-green-700">{money(r.paid)}</p></div>
          <div className="bg-white/60 rounded-xl px-3 py-2.5"><p className={muted}>Remaining</p><p className="text-base font-semibold text-gray-800">{money(detail.remaining)}</p></div>
        </div>
        <div role="progressbar" aria-label="Verified payment progress" aria-valuemin={0} aria-valuemax={Number(r.total)} aria-valuenow={Number(r.paid)} className="h-2 w-full rounded-full bg-gray-200 overflow-hidden"><div className="h-full rounded-full bg-gray-900 transition-all" style={{ width: `${paidPercent}%` }} /></div>
        <p className={muted}>Full verified payment and passed quality checks are required before dispatch.</p>
        {r.orderId && <Link className="inline-block text-sm font-medium text-gray-800 underline" href={`/orders/${r.orderId}`}>View fulfillment order and delivery progress</Link>}
        {r.status === 'FULLY_PAID' && !r.orderId && <p className="text-amber-700">Payment is complete. Fulfillment synchronization is pending; refresh shortly.</p>}
        {r.note && <p className="text-red-600">Cancellation reason: {r.note}</p>}
      </section>

      {outOfStock && <section className={panel}>
        <h2 className={heading}>Made for you</h2>
        <div>
          <Row name="Production order">{detail.production?.orderNumber ?? 'Starts after deposit verification'}</Row>
          <Row name="Production">{detail.production?.status?.replaceAll('_', ' ') ?? 'Awaiting verified deposit'}</Row>
          {detail.production?.workerName && <Row name="Assigned worker">{detail.production.workerName}</Row>}
          <Row name="Quality">{detail.production?.quality ?? 'PENDING'}</Row>
        </div>
        <p className={muted}>No available inventory is deducted. Your product is made specifically for this reservation.</p>
      </section>}

      <div className="grid gap-5 md:grid-cols-2">
        {outOfStock && staff && r.orderId && !detail.production?.shipped && <section className={panel + ' md:col-span-2'}>
          <h2 className={heading}>Worker production</h2>
          {detail.production?.status === 'AWAITING_ASSIGNMENT' && <>
            <label className={label}>Approved worker<select className={input} value={workerId} onChange={e=>setWorkerId(e.target.value)}><option value="">Select worker</option>{workerOptions.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select></label>
            <div className="flex gap-2"><button className={secondary} disabled={workerPage===0 || busy} onClick={()=>setWorkerPage(p=>p-1)}><IconChevronLeft />Previous workers</button><button className={secondary} disabled={workerPage+1>=workerPages || busy} onClick={()=>setWorkerPage(p=>p+1)}>More workers<IconChevronRight /></button></div>
          </>}
          <label className={label}>Production / quality note<textarea className={input + ' resize-none'} rows={3} maxLength={1000} value={productionNote} onChange={e=>setProductionNote(e.target.value)} /></label>
          <div className="flex flex-wrap gap-2">
            {detail.production?.status === 'AWAITING_ASSIGNMENT' && <button className={button} disabled={busy || !workerId || !productionNote.trim()} onClick={()=>void productionAction('ASSIGN')}>Assign worker</button>}
            {(detail.production?.status === 'ASSIGNED' || (detail.production?.status === 'COMPLETED' && detail.production?.quality === 'REJECTED')) && <button className={button} disabled={busy} onClick={()=>void productionAction('IN_PROGRESS')}>Start production / rework</button>}
            {detail.production?.status === 'IN_PROGRESS' && <button className={button} disabled={busy} onClick={()=>void productionAction('COMPLETED')}>Mark worker production complete</button>}
            {detail.production?.status === 'COMPLETED' && <><button className={button} disabled={busy} onClick={()=>void productionAction('APPROVE')}>Pass quality check</button><button className={danger} disabled={busy || !productionNote.trim()} onClick={()=>void productionAction('REJECT')}>Reject quality / request rework</button></>}
          </div>
          <p className={muted}>Complete production, pass quality and verify the full balance before dispatching through the linked order.</p>
        </section>}

        {staff && !pending && ['AWAITING_DEPOSIT','RESERVED'].includes(r.status) && <form className={panel + ' md:col-span-2'} onSubmit={e => { e.preventDefault(); void recordReceived(); }}>
          <h2 className={heading}>Add received payment</h2>
          <p className="text-gray-500">Record only money actually received through the QR/payment instructions shared on WhatsApp. No customer screenshot upload is required.</p>
          <p className="font-medium text-gray-800">{Number(r.paid) === 0 ? `Initial deposit required: ${money(detail.depositRequired)}` : `Flexible installments accepted. Remaining: ${money(detail.remaining)}`}</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className={label}>Amount received (₹)<input className={input} type="number" step="0.01" required min={Number(r.paid) === 0 ? detail.depositRequired : 0.01} max={detail.remaining} value={receivedAmount} onChange={e => setReceivedAmount(e.target.value)} /></label>
            <label className={label}>Transaction reference<input className={input} required minLength={6} maxLength={100} value={receivedReference} onChange={e => setReceivedReference(e.target.value)} /></label>
            <label className={label}>Payment received on<input className={input} type="datetime-local" step="1" required value={receivedDate} onChange={e => setReceivedDate(e.target.value)} /></label>
          </div>
          <label className={label}>Verification note<textarea className={input + ' resize-none'} rows={3} required maxLength={1000} value={receivedNote} onChange={e => setReceivedNote(e.target.value)} /></label>
          <label className={checkLabel}><input className="mt-0.5 accent-gray-900" type="checkbox" checked={receiptChecked} onChange={e => setReceiptChecked(e.target.checked)} />I verified this payment was received and has not already been recorded.</label>
          <button className={button} disabled={busy || !receiptChecked}>Add received payment</button>
        </form>}

        <section className={panel}>
          <h2 className={heading}>Items</h2>
          <div className="space-y-2">{r.items.map(i => <div key={i.variantId} className="border-b border-gray-100 pb-2 last:border-0"><p className="font-medium text-gray-800">{i.name}</p><p className={muted}>{i.variantLabel} · Quantity {i.quantity} · {money(i.unitPrice)} each</p></div>)}</div>
          <div className="flex justify-between pt-2 border-t border-gray-100"><span className="text-gray-500">Total</span><span className="font-semibold text-gray-800">{money(r.total)}</span></div>
        </section>
        <section className={panel}>
          <h2 className={heading}>Customer & delivery</h2>
          <div>
            <Row name="Name">{r.customerName}</Row>
            <Row name="Email">{r.email}</Row>
            <Row name="Phone">{r.phone}</Row>
            <Row name="Address">{r.address}</Row>
          </div>
        </section>
      </div>

      {staff && r.status === 'REQUESTED' && <section className={panel}>
        <h2 className={heading}>Confirm after contacting the customer</h2>
        <p className="text-gray-500">Confirmation starts a 24-hour deposit window. For remade products, worker assignment becomes available after deposit verification.</p>
        <p className="text-gray-500">Send the payment QR code or instructions to the customer manually through WhatsApp.</p>
        <button className={button} disabled={busy} onClick={() => void act('/confirm', {})}>{outOfStock ? 'Confirm remake request' : 'Confirm & hold stock'}</button>
      </section>}
      {r.bankInstructions && !['CANCELLED','EXPIRED','FULLY_PAID'].includes(r.status) && <section className={panel}>
        <h2 className={heading}>Payment instructions</h2>
        <pre className="whitespace-pre-wrap font-sans bg-white/60 rounded-xl p-3 text-gray-800">{r.bankInstructions}</pre>
        <p className={muted}>Use the bank transaction reference when submitting proof. Payments count only after the manager checks the bank credit.</p>
      </section>}
      {!r.bankInstructions && !['REQUESTED','CANCELLED','EXPIRED','FULLY_PAID'].includes(r.status) && <section className={panel}>
        <h2 className={heading}>Payment instructions</h2>
        <p className="text-gray-500">Your manager will share a payment QR code through WhatsApp. After paying, send the transaction reference to your manager or upload proof here. Only verified payments count toward your balance.</p>
      </section>}

      <section className={panel}>
        <h2 className={heading}>Payment history</h2>
        {!detail.payments.length && <p className="text-gray-400">No payment proof submitted yet.</p>}
        <div className="space-y-3">{detail.payments.map(p => <article key={p.id} className="bg-white/60 rounded-xl p-3 space-y-1.5">
          <div className="flex justify-between items-center flex-wrap gap-2"><span className={`${badge} ${paymentBadge[p.status] ?? 'bg-amber-100 text-amber-700'}`}>{p.status === 'VERIFIED' ? 'Verified' : p.status === 'REJECTED' ? 'Rejected' : 'Under review'}</span><span className={muted}>{new Date(p.submittedAt).toLocaleString()}</span></div>
          <p>Reference: <span className="font-mono text-xs text-gray-800">{p.reference}</span></p>
          <p>Submitted <strong className="text-gray-800">{money(p.claimedAmount)}</strong>{p.verifiedAmount != null && <> · Verified <strong className="text-green-700">{money(p.verifiedAmount)}</strong></>}</p>
          {p.reviewNote && <p className="text-gray-500">Manager note: {p.reviewNote}</p>}
          {p.hasProof && <button className="text-sm font-medium text-gray-800 underline disabled:opacity-40" disabled={busy} onClick={() => void preview(p.id)}>View payment screenshot</button>}
          {p.source === 'MANAGER' && <p className={muted}>Recorded by manager · Received {p.receivedAt && new Date(p.receivedAt).toLocaleString()}</p>}
        </article>)}</div>
      </section>

      {proof && <section className={panel}>
        <div className="flex justify-between items-center"><h2 className={heading}>Payment screenshot</h2><button className={secondary} onClick={() => setProof('')}>Close screenshot</button></div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="max-h-[600px] max-w-full object-contain rounded-xl" src={proof} alt="Submitted payment screenshot" />
      </section>}

      {staff && pending && <form className={panel} onSubmit={e => { e.preventDefault(); if (bankChecked) void act(`/payments/${pending.id}/review`, { approved: true, amount: Number(reviewAmount), note: reviewNote }); }}>
        <h2 className={heading}>Verify bank credit</h2>
        <p className="text-gray-500">Check the actual payment receipt and transaction reference before approving. Do not rely on the screenshot alone.</p>
        <label className={label}>Amount actually credited (₹)<input className={input} type="number" step="0.01" min="0.01" max={detail.remaining} required value={reviewAmount} onChange={e => setReviewAmount(e.target.value)} /></label>
        <label className={label}>Verification / rejection note<textarea className={input + ' resize-none'} rows={3} required maxLength={1000} value={reviewNote} onChange={e => setReviewNote(e.target.value)} /></label>
        <label className={checkLabel}><input className="mt-0.5 accent-gray-900" type="checkbox" checked={bankChecked} onChange={e => setBankChecked(e.target.checked)} />I verified that this payment was actually received.</label>
        <div className="flex flex-wrap gap-2"><button className={button} disabled={busy || !bankChecked}>Approve verified payment</button><button type="button" className={danger} disabled={busy || !reviewNote.trim()} onClick={() => void act(`/payments/${pending.id}/review`, { approved: false, note: reviewNote })}>Reject proof</button></div>
      </form>}

      {!staff && !pending && ['AWAITING_DEPOSIT','RESERVED'].includes(r.status) && <form className={panel} onSubmit={e => { e.preventDefault(); void upload(); }}>
        <h2 className={heading}>Submit bank transfer proof</h2>
        <p className="text-gray-500">Initial payment must be at least {money(detail.depositRequired)}. Subsequent payments may cover any amount up to your remaining balance.</p>
        <label className={label}>Amount transferred (₹)<input className={input} type="number" min={Number(r.paid) === 0 ? detail.depositRequired : 0.01} max={detail.remaining} step="0.01" required value={amount} onChange={e => setAmount(e.target.value)} /></label>
        <label className={label}>Bank transaction reference<input className={input} required minLength={6} maxLength={100} value={reference} onChange={e => setReference(e.target.value)} /></label>
        <label className={label}>Screenshot (PNG / JPEG, up to 2 MB)<input className={input} type="file" accept="image/png,image/jpeg" required onChange={e => setFile(e.target.files?.[0] ?? null)} /></label>
        <button className={button} disabled={busy}>Submit for review</button>
      </form>}

      {Number(r.paid) === 0 && !pending && ['REQUESTED','AWAITING_DEPOSIT','EXPIRED'].includes(r.status) && <form className={panel} onSubmit={e => { e.preventDefault(); void act('/cancel', { reason }); }}>
        <h2 className={heading}>Cancel request</h2>
        <p className="text-gray-500">The cancellation stays in your history and releases any stock held.</p>
        <label className={label}>Reason<textarea className={input + ' resize-none'} rows={3} required maxLength={1000} value={reason} onChange={e => setReason(e.target.value)} /></label>
        <button className={danger} disabled={busy}>Cancel reservation</button>
      </form>}
    </>}
  </div>;
}
