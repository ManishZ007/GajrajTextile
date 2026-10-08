"use client";
import { useEffect, useRef, useState } from "react";
import { clientFetch } from "@/lib/clientFetch";
import { Truck } from "lucide-react";

type TrackingEvent = {
  trackingId: string;
  title: string;
  description: string;
  location: string;
  eventTime: string;
};

type Tracking = {
  shipment: {
    shipmentId: string;
    provider: string;
    trackingNumber: string;
    courierName: string;
    orderSyncPending?: boolean;
  };
  currentStatus: string;
  estimatedDelivery?: string;
  timeline: TrackingEvent[];
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function ShippingTimeline({
  orderId,
  onDelivered,
}: {
  orderId: string;
  onDelivered: () => void;
}) {
  const [data, setData] = useState<Tracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const notified = useRef(false);
  const callback = useRef(onDelivered);
  callback.current = onDelivered;

  useEffect(() => {
    let active = true;
    let running = false;

    async function load() {
      if (running) return;
      running = true;
      try {
        const response = await clientFetch(`/api/shipping/${orderId}`);
        if (!response.ok)
          throw new Error(`Shipping request failed (${response.status})`);
        const result: Tracking | null = await response.json();
        if (!active) return;
        setData(result);
        setError("");
        if (
          result?.currentStatus === "DELIVERED" &&
          !result.shipment.orderSyncPending &&
          !notified.current
        ) {
          notified.current = true;
          callback.current();
        }
      } catch (err) {
        if (active)
          setError(err instanceof Error ? err.message : "Shipping unavailable");
      } finally {
        running = false;
        if (active) setLoading(false);
      }
    }

    void load();
    const timer = setInterval(() => {
      if (!document.hidden) void load();
    }, 5000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [orderId, revision]);

  return (
    <div className="border-t border-black/8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/75">
          Shipment Tracking
        </p>
        <button
          onClick={() => setRevision((v) => v + 1)}
          className="text-[0.65rem] tracking-[1.5px] uppercase text-[#1B1B1B]/40 border-b border-[#1B1B1B]/20 pb-px hover:text-[#1B1B1B]/75 hover:border-[#1B1B1B]/55 transition-colors duration-200 cursor-pointer"
        >
          Refresh
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <p className="text-[12.5px] font-light text-[#1B1B1B]/35">
          Loading tracking…
        </p>
      )}

      {/* Error */}
      {!loading && error && (
        <p className="text-[12.5px] font-light text-[#1B1B1B]/55">
          {error}. Tap Refresh to retry.
        </p>
      )}

      {/* No shipment yet */}
      {!loading && !error && !data && (
        <div className="flex items-center gap-3 py-2">
          <Truck size={14} strokeWidth={1.5} className="text-[#1B1B1B]/20 shrink-0" />
          <p className="text-[12.5px] font-light text-[#1B1B1B]/40">
            Shipment has not been created yet.
          </p>
        </div>
      )}

      {/* Shipment data */}
      {!loading && data && (
        <div className="flex flex-col gap-5">
          {/* Mock notice */}
          {data.shipment.provider === "MOCK" && (
            <p className="text-[11px] tracking-[0.5px] text-[#1B1B1B]/35 italic">
              Simulated tracking — no courier booked.
            </p>
          )}

          {/* Summary row */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-3 flex-wrap">
              <p className="text-[13px] font-light text-[#1B1B1B]">
                {data.shipment.courierName}
              </p>
              <span className="text-[0.65rem] tracking-[1.5px] uppercase text-[#1B1B1B]/35 border border-black/12 px-2 py-0.5">
                {data.currentStatus.replace(/_/g, " ")}
              </span>
            </div>
            <p className="text-[11.5px] font-light text-[#1B1B1B]/45 font-mono">
              {data.shipment.trackingNumber}
            </p>
            {data.estimatedDelivery &&
              data.currentStatus !== "DELIVERED" &&
              data.currentStatus !== "CANCELLED" && (
                <p className="text-[12px] font-light text-[#1B1B1B]/55">
                  Est. delivery — {fmtDate(data.estimatedDelivery)}
                </p>
              )}
            {data.shipment.orderSyncPending && (
              <p className="text-[11px] text-[#1B1B1B]/35 italic">
                Order update pending — retrying automatically.
              </p>
            )}
          </div>

          {/* Timeline events */}
          {data.timeline.length > 0 && (
            <div className="flex flex-col gap-0">
              {data.timeline.map((event, i) => {
                const isFirst = i === 0;
                const isLast = i === data.timeline.length - 1;
                return (
                  <div key={event.trackingId} className="flex items-stretch gap-4">
                    {/* Dot + connecting line */}
                    <div
                      className="flex flex-col items-center"
                      style={{ width: "16px", flexShrink: 0 }}
                    >
                      <div
                        className="rounded-full shrink-0"
                        style={{
                          width: "8px",
                          height: "8px",
                          marginTop: "4px",
                          background: isLast
                            ? "#1B1B1B"
                            : "rgba(27,27,27,0.18)",
                        }}
                      />
                      {!isLast && (
                        <div
                          className="w-px flex-1 my-1"
                          style={{
                            background: "rgba(27,27,27,0.08)",
                            minHeight: "16px",
                          }}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div
                      style={{ paddingBottom: isLast ? 0 : "14px" }}
                      className="flex flex-col gap-0.5"
                    >
                      <p
                        className="text-[13px] font-light"
                        style={{
                          color: isLast ? "#1B1B1B" : "rgba(27,27,27,0.65)",
                        }}
                      >
                        {event.title}
                      </p>
                      {event.description && (
                        <p className="text-[12px] font-light text-[#1B1B1B]/40">
                          {event.description}
                        </p>
                      )}
                      <p className="text-[11px] text-[#1B1B1B]/30 mt-0.5">
                        {event.location && `${event.location} · `}
                        {fmtDateTime(event.eventTime)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
