"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { listChecks, CheckPage, CheckRow } from "@/lib/api/orderChecksApi";
export default function OrderChecksPage({ view }: { view: "holds" | "quality" }) {
  const [quality, setQuality] = useState(view === "quality" ? "PENDING" : "");
  const [page, setPage] = useState(0);
  const [data, setData] = useState<CheckPage<CheckRow> | null>(null);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let current = true; setData(null); setError("");
    listChecks(view, quality, page).then(result => { if (current) setData(result); })
      .catch(e => { if (current) setError(e instanceof Error ? e.message : "Could not load orders"); });
    return () => { current = false; };
  }, [view, quality, page, revision]);
  return <div className="space-y-5">
    <div className="flex flex-wrap justify-between gap-4"><div><h1 className="text-2xl font-semibold">{view === "holds" ? "Orders on hold" : "Quality checks"}</h1><p className="mt-2 text-sm text-gray-600">Ready-made customer orders before shipping. Open an order to inspect, hold or release it.</p></div><button className="underline" onClick={() => setRevision(v => v + 1)}>Refresh</button></div>
    {view === "quality" && <label className="flex items-center gap-3 text-sm">Quality status<select value={quality} onChange={e => { setQuality(e.target.value); setPage(0); }} className="rounded-lg border bg-white p-2"><option value="PENDING">Awaiting check</option><option value="REJECTED">Failed</option><option value="APPROVED">Passed</option><option value="">All</option></select></label>}
    {error ? <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p> : !data ? <p>Loading orders…</p> : <>
      <p className="text-sm text-gray-600">{data.totalElements} orders</p>
      <div className="overflow-x-auto rounded-2xl border bg-white/50"><table className="w-full text-left text-sm"><thead className="border-b"><tr>{["Order", "Placed", "Order status", "Quality", "Hold reason", ""].map((label, index) => <th key={index} className="p-4">{label}</th>)}</tr></thead><tbody>
        {data.content.map(order => <tr key={order.orderId} className="border-b last:border-0"><td className="p-4 font-medium">{order.orderNumber || "Order"}</td><td className="p-4">{new Date(order.orderDate).toLocaleDateString("en-IN")}</td><td className="p-4">{order.orderStatus.replaceAll("_", " ")}</td><td className="p-4">{order.quality === "APPROVED" ? "Passed" : order.quality === "REJECTED" ? "Failed" : "Awaiting check"}</td><td className="max-w-xs break-words p-4">{order.holdReason || "—"}</td><td className="p-4"><Link className="underline" href={`/orders/${order.orderId}#dispatch-checks`}>Open order</Link></td></tr>)}
        {!data.content.length && <tr><td colSpan={6} className="p-8 text-center text-gray-500">No orders match this view.</td></tr>}
      </tbody></table></div>
      <div className="flex items-center justify-end gap-4 text-sm"><button disabled={page === 0} className="disabled:opacity-40" onClick={() => setPage(p => p - 1)}>Previous</button><span>Page {page + 1} of {Math.max(1, data.totalPages)}</span><button disabled={page + 1 >= data.totalPages} className="disabled:opacity-40" onClick={() => setPage(p => p + 1)}>Next</button></div>
    </>}
  </div>;
}
