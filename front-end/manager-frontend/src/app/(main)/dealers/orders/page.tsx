"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchDealerOrders, DealerOrder } from "@/lib/api/dealerApi";
import { usePageTitle } from "@/hooks/usePagetitle";
import { IconLoader, IconPlus } from "@/providers/Icons";

const STATUSES = ["ALL", "DRAFT", "CONFIRMED", "IN_PRODUCTION", "READY", "DELIVERED", "CANCELLED"];

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

export default function DealerOrdersPage() {
  usePageTitle("Dealer Orders");
  const router = useRouter();
  const [orders, setOrders] = useState<DealerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [total, setTotal] = useState(0);

  useEffect(() => { load(); }, [statusFilter]);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchDealerOrders({
        size: 50,
        status: statusFilter === "ALL" ? undefined : statusFilter,
      });
      setOrders(data.orders ?? []);
      setTotal(data.totalElements ?? 0);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Dealer Orders</h1>
          <p className="text-xs text-gray-400 mt-0.5">{total} total orders</p>
        </div>
        <button
          onClick={() => router.push("/dealers/orders/new")}
          className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-black transition-colors"
        >
          <IconPlus />
          New order
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              statusFilter === s
                ? "bg-gray-900 text-white"
                : "bg-white/60 text-gray-500 hover:bg-white/80 border border-gray-200"
            }`}
          >
            {s === "ALL" ? "All" : s.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40 gap-2 text-gray-400">
            <IconLoader /><span className="text-sm">Loading...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-400">
            <p className="text-sm">No orders found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Order #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Dealer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Items</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Total</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Paid</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Balance</th>
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
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-800">{order.dealer?.name}</p>
                      <p className="text-xs text-gray-400">{order.dealer?.phone}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{order.items?.length ?? 0}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{formatINR(order.totalAmount)}</td>
                  <td className="px-4 py-3 text-emerald-600">{formatINR(order.paidAmount)}</td>
                  <td className="px-4 py-3 text-red-500">{formatINR(order.balanceAmount)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[order.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {order.status.replace("_", " ")}
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
  );
}
