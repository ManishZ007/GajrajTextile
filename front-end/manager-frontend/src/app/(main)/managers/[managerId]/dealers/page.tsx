"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchManagerDealers, fetchManagers, ManagerUser } from "@/lib/api/ownerApi";
import { Dealer } from "@/lib/api/dealerApi";
import { usePageTitle } from "@/hooks/usePagetitle";
import { IconChevronLeft, IconLoader } from "@/providers/Icons";

const TYPE_BADGE: Record<string, string> = {
  DEALER:     "bg-blue-100 text-blue-700",
  TRADER:     "bg-purple-100 text-purple-700",
  WHOLESALER: "bg-orange-100 text-orange-700",
  RETAILER:   "bg-green-100 text-green-700",
  OTHER:      "bg-gray-100 text-gray-600",
};

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function ManagerDealersPage() {
  usePageTitle("Manager Dealers");
  const { managerId } = useParams<{ managerId: string }>();
  const router = useRouter();

  const [manager, setManager] = useState<ManagerUser | null>(null);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [allManagers, dealerList] = await Promise.all([
          fetchManagers(),
          fetchManagerDealers(managerId),
        ]);
        setManager(allManagers.find((m) => m.userId === managerId) ?? null);
        setDealers(dealerList);
      } catch {
        setDealers([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [managerId]);

  const filtered = dealers.filter((d) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.phone.includes(q) ||
      (d.city ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => router.push(`/managers/${managerId}`)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <IconChevronLeft />
        </button>
        <div className="flex-1">
          <p className="text-xs text-gray-400">
            {manager ? manager.fullName : "Manager"} — registered dealers
          </p>
          <h1 className="text-lg font-semibold text-gray-800">Dealers</h1>
        </div>
        <input
          type="text"
          placeholder="Search name, phone, city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-xl w-56 focus:outline-none focus:border-gray-400 bg-white/60 text-gray-700 placeholder-gray-400"
        />
      </div>

      {/* Table */}
      <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40 gap-2 text-gray-400">
            <IconLoader /><span className="text-sm">Loading...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-400">
            <p className="text-sm">
              {search ? "No dealers match your search" : "No dealers registered yet"}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Dealer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Location</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">GST</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Registered</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((dealer) => (
                <tr
                  key={dealer.dealerId}
                  onClick={() => router.push(`/dealers/${dealer.dealerId}`)}
                  className="border-t border-gray-50 hover:bg-white/50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {initials(dealer.name)}
                      </div>
                      <span className="font-medium text-gray-800">{dealer.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{dealer.phone}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {[dealer.city, dealer.state].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {dealer.dealerType ? (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TYPE_BADGE[dealer.dealerType] ?? "bg-gray-100 text-gray-600"}`}>
                        {dealer.dealerType}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                    {dealer.gstNumber || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {formatDate(dealer.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer count */}
      {!loading && (
        <p className="text-xs text-gray-400 text-right">
          {filtered.length} dealer{filtered.length !== 1 ? "s" : ""}
          {search ? ` matching "${search}"` : ` registered by ${manager?.fullName ?? "this manager"}`}
        </p>
      )}
    </div>
  );
}
