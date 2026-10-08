"use client";
import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api/apiFetch";
import { advanceMockStatus } from "@/lib/api/shippingApi";

type Tracking = {
  shipment: { shipmentId: string; provider: string; trackingNumber: string; courierName: string; orderSyncPending?: boolean };
  currentStatus: string; estimatedDelivery?: string;
  timeline: { trackingId: string; title: string; description: string; location: string; eventTime: string }[];
};
export default function ShippingTimeline({ orderId, onDelivered }: { orderId: string; onDelivered: () => void }) {
  const [data, setData] = useState<Tracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const notified = useRef(false);
  const callback = useRef(onDelivered); callback.current = onDelivered;
  useEffect(() => {
    let active = true; let running = false;
    async function load() {
      if (running) return; running = true;
      try {
        const token = localStorage.getItem("access_token");
        const result: Tracking | null = await apiFetch(`http://localhost:8089/shipping/order/${orderId}/timeline`, { headers: { Authorization: `Bearer ${token ?? ""}` } });
        if (!active) return;
        setData(result); setError("");
        if (result?.currentStatus === "DELIVERED" && !result.shipment.orderSyncPending && !notified.current) {
          notified.current = true; callback.current();
        }
      } catch (error) { if (active) setError(error instanceof Error ? error.message : "Shipping unavailable"); }
      finally { running = false; if (active) setLoading(false); }
    }
    void load();
    const timer = setInterval(() => { if (!document.hidden) void load(); }, 5000);
    return () => { active = false; clearInterval(timer); };
  }, [orderId, revision]);
  async function advance() {
    if (!data || busy) return; setBusy(true);
    try { await advanceMockStatus(data.shipment.shipmentId, data.currentStatus); setRevision(v => v + 1); }
    catch (error) { setError(error instanceof Error ? error.message : "Could not advance shipment"); }
    finally { setBusy(false); }
  }
  return <section className="rounded-xl border border-gray-200 p-5 space-y-4 bg-white/50">
    <div className="flex items-center justify-between gap-3"><h3 className="font-semibold">Shipment tracking</h3><button className="text-sm underline" onClick={() => setRevision(v => v + 1)}>Refresh</button></div>
    {error && <p role="alert" className="text-sm text-red-700">{error}. Refresh to retry.</p>}
    {loading ? <p role="status">Loading tracking...</p> : !data ? <p className="text-sm text-gray-500">{error ? "Tracking unavailable" : "Shipment has not been created yet."}</p> : <>
      {data.shipment.provider === "MOCK" && <p className="text-xs text-amber-800">Mock shipment — simulated updates, no courier booked.</p>}
      <p className="text-sm">{data.shipment.courierName} · {data.shipment.trackingNumber}</p>
      <p className="font-medium">{data.currentStatus.replace(/_/g, " ")}</p>
      {data.currentStatus !== "DELIVERED" && data.currentStatus !== "CANCELLED" && data.estimatedDelivery && <p className="text-sm">Estimated delivery: {new Date(data.estimatedDelivery).toLocaleDateString("en-IN")}</p>}
      {data.shipment.orderSyncPending && <p className="text-xs text-amber-800">Order update pending; retrying automatically.</p>}
      {data.shipment.provider === "MOCK" && !["DELIVERED", "CANCELLED", "RETURNED"].includes(data.currentStatus) && <button disabled={busy || data.shipment.orderSyncPending} onClick={() => void advance()} className="rounded-lg bg-black text-white px-4 py-2 text-sm disabled:opacity-40">{busy ? "Updating..." : "Simulate next shipping step"}</button>}
      <ol className="border-l border-gray-300 ml-2 space-y-4">{data.timeline.map(event => <li key={event.trackingId} className="pl-4">
        <p className="text-sm font-medium">{event.title}</p><p className="text-xs text-gray-600">{event.description}</p>
        <p className="text-xs text-gray-500 mt-1">{event.location} · {new Date(event.eventTime).toLocaleString("en-IN")}</p>
      </li>)}</ol>
    </>}
  </section>;
}
