"use client";
import { useEffect, useState } from "react";
import { actOnCheck, checkHistory, CheckOrder, CheckEvent, CheckPage } from "@/lib/api/orderChecksApi";
import { apiFetch } from "@/lib/api/apiFetch";

const labels: Record<string, string> = { HOLD: "Placed on hold", RELEASE: "Hold released", APPROVE: "Quality check passed", REJECT: "Quality check failed" };
export default function DispatchChecks({ order, onChanged }: { order: CheckOrder; onChanged: () => Promise<void> }) {
  const [note, setNote] = useState("");
  const [action, setAction] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [historyError, setHistoryError] = useState("");
  const [history, setHistory] = useState<CheckPage<CheckEvent> | null>(null);
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [names, setNames] = useState<Record<string, string>>({});
  useEffect(() => {
    let current = true;
    apiFetch("http://localhost:8081/auth/admin/report-staff").then((staff: {id: string; name: string}[]) => {
      if (current) setNames(Object.fromEntries(staff.map(s => [s.id, s.name])));
    }).catch(() => { /* History remains available even if the staff directory is offline. */ });
    return () => { current = false; };
  }, []);
  useEffect(() => {
    let current = true; setHistory(null); setHistoryError("");
    checkHistory(order.orderId, page).then(data => { if (current) setHistory(data); })
      .catch(() => { if (current) setHistoryError("Check history unavailable. Retry to load it."); });
    return () => { current = false; };
  }, [order.orderId, page, revision]);
  const held = order.orderStatus === "ON_HOLD";
  const eligible = !order.shipmentStarted && ["CONFIRMED", "IN_PROGRESS", "COMPLETED", "ON_HOLD"].includes(order.orderStatus);
  async function submit() {
    if (busy || !action) return;
    setBusy(true); setError("");
    try {
      await actOnCheck(order.orderId, action, note);
      setAction(""); setNote(""); setPage(0); setRevision(v => v + 1);
      await onChanged();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save the check. Refresh and try again."); }
    finally { setBusy(false); }
  }
  return <section className="rounded-2xl border border-white/70 bg-white/50 p-6 space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="font-semibold text-gray-800">Ready-made dispatch checks</h2>
      <span className={`rounded-full px-3 py-1 text-sm ${order.readyMadeQuality === "APPROVED" ? "bg-emerald-100 text-emerald-800" : order.readyMadeQuality === "REJECTED" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>
        Quality: {order.readyMadeQuality === "APPROVED" ? "Passed" : order.readyMadeQuality === "REJECTED" ? "Failed" : "Awaiting check"}
      </span>
    </div>
    {held && <p className="rounded-lg bg-amber-50 p-3 text-amber-900">On hold: {order.holdReason || "Earlier hold — add a resolution to release it."}</p>}
    <p className="text-sm text-gray-600">Inspect the product, variant, quantity and packaging before passing quality. Orders on hold or awaiting a passed check cannot be shipped. Releasing a hold requires another check.</p>
    {eligible ? <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {(held ? ["RELEASE"] : ["APPROVE", "REJECT", "HOLD"]).map(value => <button key={value} disabled={busy} aria-pressed={action === value} onClick={() => { setAction(value); setError(""); }} className={`rounded-lg border px-4 py-2 text-sm disabled:opacity-50 ${action === value ? "bg-black text-white" : "bg-white"}`}>
          {value === "APPROVE" ? "Pass quality" : value === "REJECT" ? "Fail quality" : value === "HOLD" ? "Place on hold" : "Release hold"}
        </button>)}
      </div>
      {action && <div className="space-y-2">
        <label className="block text-sm" htmlFor={`check-note-${order.orderId}`}>{action === "RELEASE" ? "Resolution" : "Inspection notes / reason"}{action !== "APPROVE" ? " (required)" : " (optional)"}</label>
        <textarea id={`check-note-${order.orderId}`} maxLength={1000} value={note} disabled={busy} onChange={e => setNote(e.target.value)} className="w-full rounded-lg border bg-white p-3" rows={3} />
        <button onClick={submit} disabled={busy || (action !== "APPROVE" && !note.trim())} className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-40">{busy ? "Saving…" : "Confirm action"}</button>
      </div>}
    </div> : <p className="text-sm text-gray-600">{order.shipmentStarted ? "Shipment has started; dispatch checks are now read-only." : "Checks become available once the order is confirmed."}</p>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <details className="border-t pt-3">
      <summary className="cursor-pointer text-sm font-medium">Check history</summary>
      {historyError ? <p role="alert" className="mt-3 text-red-700">{historyError} <button className="underline" onClick={() => setRevision(v => v + 1)}>Retry</button></p> : !history ? <p className="mt-3 text-sm">Loading…</p> : <>
        {!history.content.length && <p className="mt-3 text-sm text-gray-500">No dispatch checks recorded yet.</p>}
        <ul className="divide-y">{history.content.map(event => <li key={event.id} className="py-3 text-sm">
          <p className="font-medium">{labels[event.action] || event.action}</p>
          <p className="text-gray-600">{names[event.actor] || "Staff name unavailable"} · {new Date(event.createdAt).toLocaleString("en-IN")}</p>
          {event.note && <p className="mt-1 whitespace-pre-wrap break-words">{event.note}</p>}
        </li>)}</ul>
        {history.totalPages > 1 && <div className="flex gap-4 text-sm"><button disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</button><span>{page + 1} / {history.totalPages}</span><button disabled={page + 1 >= history.totalPages} onClick={() => setPage(p => p + 1)}>Next</button></div>}
      </>}
    </details>
  </section>;
}
