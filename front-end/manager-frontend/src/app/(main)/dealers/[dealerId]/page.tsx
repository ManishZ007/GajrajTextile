"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  fetchDealerById,
  fetchDealerOrdersByDealer,
  Dealer,
  DealerOrder,
} from "@/lib/api/dealerApi";
import { usePageTitle } from "@/hooks/usePagetitle";
import { IconChevronLeft, IconLoader, IconPlus } from "@/providers/Icons";

const STATUS_BADGE: Record<string, string> = {
  DRAFT:         "bg-gray-100 text-gray-600",
  CONFIRMED:     "bg-blue-100 text-blue-700",
  IN_PRODUCTION: "bg-orange-100 text-orange-700",
  READY:         "bg-purple-100 text-purple-700",
  DELIVERED:     "bg-emerald-100 text-emerald-700",
  CANCELLED:     "bg-red-100 text-red-700",
};

function formatINR(n: number) {
  return "₹" + Number(n).toLocaleString("en-IN");
}

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function DealerDetailPage() {
  usePageTitle("Dealer Detail");
  const { dealerId } = useParams<{ dealerId: string }>();
  const router = useRouter();

  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [orders, setOrders] = useState<DealerOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [dealerId]);

  async function load() {
    setLoading(true);
    try {
      const [dealerData, ordersData] = await Promise.all([
        fetchDealerById(dealerId),
        fetchDealerOrdersByDealer(dealerId),
      ]);
      setDealer(dealerData);
      setOrders(ordersData.orders ?? []);
    } catch {
      setDealer(null);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-gray-400">
        <IconLoader /><span className="text-sm">Loading...</span>
      </div>
    );
  }

  if (!dealer) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-sm text-gray-500">Dealer not found</p>
        <button onClick={() => router.push("/dealers")} className="text-sm border border-gray-200 rounded-xl px-4 py-2 hover:bg-gray-50">
          Back to dealers
        </button>
      </div>
    );
  }

  const totalOrderValue = orders.reduce((s, o) => s + Number(o.totalAmount), 0);
  const totalPaid = orders.reduce((s, o) => s + Number(o.paidAmount), 0);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/dealers")} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
          <IconChevronLeft />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-gray-800">{dealer.name}</h1>
          <p className="text-xs text-gray-400">{dealer.dealerType ?? "Dealer"}</p>
        </div>
        <button
          onClick={() => router.push(`/dealers/orders/new?dealerId=${dealerId}`)}
          className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-black transition-colors"
        >
          <IconPlus />
          New order
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total orders", value: orders.length },
          { label: "Total value", value: formatINR(totalOrderValue) },
          { label: "Total paid", value: formatINR(totalPaid) },
          { label: "Balance due", value: formatINR(totalOrderValue - totalPaid) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl p-4">
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <p className="text-lg font-bold text-gray-800">{value}</p>
          </div>
        ))}
      </div>

      {/* Info + Orders */}
      <div className="grid grid-cols-1 sm:grid-cols-[280px_1fr] gap-4">
        {/* Left — dealer info */}
        <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl p-5 flex flex-col gap-3 h-fit">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Dealer info</p>
          {[
            { label: "Phone", value: dealer.phone },
            { label: "Email", value: dealer.email },
            { label: "Address", value: dealer.address },
            { label: "City", value: dealer.city },
            { label: "State", value: dealer.state },
            { label: "GST", value: dealer.gstNumber },
          ].map(({ label, value }) =>
            value ? (
              <div key={label}>
                <p className="text-[10px] text-gray-400">{label}</p>
                <p className="text-sm text-gray-700">{value}</p>
              </div>
            ) : null
          )}
          {dealer.notes && (
            <div>
              <p className="text-[10px] text-gray-400">Notes</p>
              <p className="text-sm text-gray-500 italic">{dealer.notes}</p>
            </div>
          )}
          <div className="pt-2 border-t border-gray-100">
            <p className="text-[10px] text-gray-400">Registered on</p>
            <p className="text-xs text-gray-500">{formatDate(dealer.createdAt)}</p>
          </div>
        </div>

        {/* Right — orders list */}
        <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Orders ({orders.length})</p>
          </div>
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-400">
              <p className="text-sm">No orders yet</p>
              <button
                onClick={() => router.push(`/dealers/orders/new?dealerId=${dealerId}`)}
                className="text-xs border border-gray-200 rounded-xl px-3 py-1.5 hover:bg-gray-50 text-gray-500"
              >
                Create first order
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Order #</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Items</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Paid</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.dealerOrderId}
                    onClick={() => router.push(`/dealers/orders/${order.dealerOrderId}`)}
                    className="border-t border-gray-50 hover:bg-white/50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{order.orderNumber}</td>
                    <td className="px-4 py-3 text-gray-500">{order.items?.length ?? 0} item{(order.items?.length ?? 0) !== 1 ? "s" : ""}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{formatINR(order.totalAmount)}</td>
                    <td className="px-4 py-3 text-emerald-600">{formatINR(order.paidAmount)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[order.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
