"use client";

import { useEffect, useMemo, useState } from "react";
import { usePageTitle } from "@/hooks/usePagetitle";
import { fetchSupportCases } from "@/lib/api/supportApi";
import { IconChevronDown, IconEmptyBox, IconLoader } from "@/providers/Icons";

// ── Types ──────────────────────────────────────────────────────────────────────

interface SupportCase {
  caseId: string;
  orderId: string;
  customerId: string;
  issueType: string;
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  handledBy?: string;
  resolutionNote?: string;
  createdAt: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const ISSUE_TYPE_BADGE: Record<string, string> = {
  ORDER_DELAY: "bg-blue-100 text-blue-700",
  DAMAGE: "bg-red-100 text-red-700",
  PAYMENT: "bg-purple-100 text-purple-700",
  QUALITY: "bg-amber-100 text-amber-700",
  OTHER: "bg-gray-200 text-gray-700",
};

const ISSUE_TYPE_LABEL: Record<string, string> = {
  ORDER_DELAY: "Order delay",
  DAMAGE: "Damage",
  PAYMENT: "Payment issue",
  QUALITY: "Quality issue",
  OTHER: "Other",
};

const STATUS_BADGE: Record<string, { cls: string; label: string }> = {
  OPEN: { cls: "bg-red-100 text-red-700", label: "Open" },
  IN_PROGRESS: { cls: "bg-amber-100 text-amber-700", label: "In progress" },
  RESOLVED: { cls: "bg-emerald-100 text-emerald-700", label: "Resolved" },
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function truncate(str: string, len = 100) {
  if (!str) return "—";
  return str.length > len ? str.slice(0, len) + "…" : str;
}

function latestStatus(tickets: SupportCase[]): "OPEN" | "IN_PROGRESS" | "RESOLVED" {
  if (tickets.some((t) => t.status === "OPEN")) return "OPEN";
  if (tickets.some((t) => t.status === "IN_PROGRESS")) return "IN_PROGRESS";
  return "RESOLVED";
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function SupportLinkedOrders() {
  const title = usePageTitle();

  const [cases, setCases] = useState<SupportCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);

  useEffect(() => {
    fetchSupportCases({ size: 1000 })
      .then((data: { content: SupportCase[] }) => setCases(data.content ?? []))
      .catch(() => setCases([]))
      .finally(() => setLoading(false));
  }, []);

  // Group by orderId client-side
  const groups = useMemo(() => {
    return cases.reduce((acc: Record<string, SupportCase[]>, c) => {
      if (!c.orderId) return acc;
      if (!acc[c.orderId]) acc[c.orderId] = [];
      acc[c.orderId].push(c);
      return acc;
    }, {});
  }, [cases]);

  const orderIds = useMemo(() =>
    Object.keys(groups).sort((a, b) => {
      const latestA = Math.max(...groups[a].map((c) => new Date(c.createdAt).getTime()));
      const latestB = Math.max(...groups[b].map((c) => new Date(c.createdAt).getTime()));
      return latestB - latestA;
    }),
    [groups]
  );

  function toggleOrder(orderId: string) {
    setExpandedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
    setExpandedCaseId(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 gap-3 text-gray-400">
        <IconLoader /><span className="text-sm">Loading linked orders...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
        {orderIds.length > 0 && (
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-600">
            {orderIds.length} order{orderIds.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* ── Table card ────────────────────────────────────────────────────────── */}
      <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl overflow-hidden">
        {orderIds.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <IconEmptyBox />
            <p className="text-lg font-medium text-gray-500">No linked orders</p>
            <p className="text-sm text-gray-400">Tickets will appear here grouped by order ID</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-gray-400 font-medium border-b border-gray-100">
                <th className="text-left px-5 py-3">Order ID</th>
                <th className="text-left px-5 py-3">Tickets</th>
                <th className="text-left px-5 py-3">Latest status</th>
                <th className="text-left px-5 py-3">Latest date</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {orderIds.map((orderId) => {
                const tickets = groups[orderId];
                const isExpanded = expandedOrders.has(orderId);
                const statusKey = latestStatus(tickets);
                const statusBadge = STATUS_BADGE[statusKey] ?? STATUS_BADGE.OPEN;
                const latestDate = tickets.reduce(
                  (latest, t) => new Date(t.createdAt) > new Date(latest) ? t.createdAt : latest,
                  tickets[0].createdAt
                );

                return [
                  // ── Order row ──────────────────────────────────────────
                  <tr
                    key={orderId}
                    onClick={() => toggleOrder(orderId)}
                    className="border-t border-gray-100 hover:bg-white/40 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3">
                      <span className="font-mono text-sm font-medium text-gray-800">{orderId}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                        {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusBadge.cls}`}>{statusBadge.label}</span>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-400">{formatDate(latestDate)}</td>
                    <td className="px-5 py-3">
                      <span className={`text-gray-400 transition-transform inline-block ${isExpanded ? "rotate-180" : ""}`}>
                        <IconChevronDown />
                      </span>
                    </td>
                  </tr>,

                  // ── Expanded ticket rows ──────────────────────────────
                  ...(isExpanded ? tickets.map((ticket) => {
                    const issueCls = ISSUE_TYPE_BADGE[ticket.issueType] ?? "bg-gray-100 text-gray-600";
                    const issueLabel = ISSUE_TYPE_LABEL[ticket.issueType] ?? ticket.issueType;
                    const tStatus = STATUS_BADGE[ticket.status] ?? STATUS_BADGE.OPEN;
                    const isCaseExpanded = expandedCaseId === ticket.caseId;

                    return [
                      <tr
                        key={ticket.caseId}
                        onClick={(e) => { e.stopPropagation(); setExpandedCaseId(isCaseExpanded ? null : ticket.caseId); }}
                        className="border-t border-gray-100 bg-gray-50/60 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <td className="pl-10 pr-4 py-2.5" colSpan={4}>
                          <div className="flex items-center gap-3">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${issueCls}`}>{issueLabel}</span>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${tStatus.cls}`}>{tStatus.label}</span>
                            <span className="text-xs text-gray-500 flex-1 truncate">{truncate(ticket.description, 80)}</span>
                            <span className="text-xs text-gray-400 shrink-0">{formatDate(ticket.createdAt)}</span>
                          </div>
                        </td>
                        <td className="pr-5 py-2.5">
                          <span className={`text-gray-400 transition-transform inline-block ${isCaseExpanded ? "rotate-180" : ""}`}>
                            <IconChevronDown />
                          </span>
                        </td>
                      </tr>,

                      ...(isCaseExpanded ? [
                        <tr key={`${ticket.caseId}-detail`} className="border-t-0 bg-gray-50">
                          <td colSpan={5} className="pl-10 pr-5 pb-3 pt-0">
                            <div className="bg-white/60 rounded-xl p-4 flex flex-col gap-2.5">
                              <div className="flex flex-wrap gap-4">
                                {([
                                  ["Customer ID", ticket.customerId],
                                  ...(ticket.handledBy ? [["Handled by", ticket.handledBy]] : []),
                                ] as [string, string][]).map(([k, v]) => (
                                  <div key={k}>
                                    <p className="text-[10px] font-medium text-[#616a7c] uppercase tracking-wide">{k}</p>
                                    <p className="text-xs font-mono text-gray-700 mt-0.5">{v}</p>
                                  </div>
                                ))}
                              </div>
                              <div>
                                <p className="text-[10px] font-medium text-[#616a7c] uppercase tracking-wide mb-1">Description</p>
                                <p className="text-xs text-gray-700 leading-relaxed">{ticket.description || "—"}</p>
                              </div>
                              {ticket.resolutionNote && (
                                <div>
                                  <p className="text-[10px] font-medium text-[#616a7c] uppercase tracking-wide mb-1">Resolution note</p>
                                  <p className="text-xs text-gray-700 leading-relaxed">{ticket.resolutionNote}</p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ] : [])
                    ];
                  }).flat() : [])
                ];
              }).flat()}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
