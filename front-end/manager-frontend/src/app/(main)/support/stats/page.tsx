"use client";

import { useEffect, useState } from "react";
import { usePageTitle } from "@/hooks/usePagetitle";
import { fetchSupportStats } from "@/lib/api/supportApi";
import { IconLoader } from "@/providers/Icons";

// ── Types ──────────────────────────────────────────────────────────────────────

interface SupportStats {
  totalCases: number;
  openCases: number;
  inProgressCases: number;
  resolvedCases: number;
  avgResolutionTimeHours: number;
  resolvedThisMonth: number;
  resolutionRate: number;
  issueTypeCounts: Record<string, number>;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const ISSUE_TYPE_LABEL: Record<string, string> = {
  ORDER_DELAY: "Order delay",
  DAMAGE: "Damage",
  PAYMENT: "Payment issue",
  QUALITY: "Quality issue",
  OTHER: "Other",
};

const BAR_COLORS: Record<string, string> = {
  ORDER_DELAY: "bg-blue-400",
  DAMAGE: "bg-red-400",
  PAYMENT: "bg-purple-400",
  QUALITY: "bg-amber-400",
  OTHER: "bg-gray-400",
};

const BAR_LABEL_COLORS: Record<string, string> = {
  ORDER_DELAY: "text-blue-700",
  DAMAGE: "text-red-700",
  PAYMENT: "text-purple-700",
  QUALITY: "text-amber-700",
  OTHER: "text-gray-600",
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatAvgTime(hours: number): string {
  if (!hours || hours <= 0) return "—";
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl px-5 py-4">
      <p className="text-[10px] font-medium text-[#616a7c] uppercase tracking-wide">
        {label}
      </p>
      <p className={`text-3xl font-bold mt-1 ${accent ?? "text-gray-800"}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function SupportStats() {
  const title = usePageTitle();

  const [stats, setStats] = useState<SupportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    fetchSupportStats()
      .then((data: SupportStats) => {
        if (!data || data.totalCases === 0) setEmpty(true);
        else setStats(data);
      })
      .catch(() => setEmpty(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 gap-3 text-gray-400">
        <IconLoader />
        <span className="text-sm">Loading support stats...</span>
      </div>
    );
  }

  if (empty || !stats) {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
        <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl flex flex-col items-center justify-center py-20 gap-3">
          <svg
            className="w-12 h-12 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.25}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <p className="text-lg font-medium text-gray-500">
            No support data yet
          </p>
          <p className="text-sm text-gray-400">
            Stats will appear once tickets are created
          </p>
        </div>
      </div>
    );
  }

  const rate = Math.min(
    100,
    Math.max(
      0,
      stats.resolutionRate ??
        (stats.totalCases > 0
          ? Math.round((stats.resolvedCases / stats.totalCases) * 100)
          : 0),
    ),
  );
  const circumference = 2 * Math.PI * 40;
  const dashOffset = circumference * (1 - rate / 100);

  const issueTypeCounts = stats.issueTypeCounts ?? {};
  const countEntries = Object.entries(issueTypeCounts).sort(
    ([, a], [, b]) => b - a,
  );
  const maxCount = Math.max(...countEntries.map(([, v]) => v), 1);

  return (
    <div className="flex flex-col gap-5">
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>

      {/* ── 4 Stat cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Total tickets"
          value={(stats?.totalCases ?? 0).toLocaleString("en-IN")}
          sub="all time"
        />
        <StatCard
          label="Open"
          value={(stats?.openCases ?? 0).toLocaleString("en-IN")}
          sub={
            (stats?.inProgressCases ?? 0) > 0
              ? `${stats?.inProgressCases ?? 0} in progress`
              : "awaiting action"
          }
          accent={
            (stats?.openCases ?? 0 > 0) ? "text-red-600" : "text-gray-800"
          }
        />
        <StatCard
          label="Avg resolution time"
          value={formatAvgTime(stats.avgResolutionTimeHours)}
          sub="from open to resolved"
        />
        <StatCard
          label="Resolved this month"
          value={(stats?.resolvedThisMonth ?? 0).toLocaleString("en-IN")}
          sub="last 30 days"
          accent="text-emerald-600"
        />
      </div>

      {/* ── Bottom row ──────────────────────────────────────────────────────── */}
      <div className="flex gap-5">
        {/* ─ Issue type bar chart ─────────────────────────────────────────── */}
        <div className="flex-1 bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl p-6">
          <p className="text-sm font-semibold text-gray-700 mb-5">
            Top issue types
          </p>
          {countEntries.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              No issue data yet
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {countEntries.map(([type, count]) => {
                const barCls = BAR_COLORS[type] ?? "bg-gray-400";
                const labelCls = BAR_LABEL_COLORS[type] ?? "text-gray-600";
                const pct = Math.round((count / maxCount) * 100);
                return (
                  <div key={type} className="flex items-center gap-3">
                    <span
                      className={`text-xs font-medium w-28 shrink-0 ${labelCls}`}
                    >
                      {ISSUE_TYPE_LABEL[type] ?? type}
                    </span>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barCls}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 w-6 text-right tabular-nums">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ─ Resolution rate circular progress ────────────────────────────── */}
        <div className="w-64 shrink-0 bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl p-6 flex flex-col items-center justify-center gap-4">
          <p className="text-sm font-semibold text-gray-700">Resolution rate</p>

          <div className="relative w-36 h-36">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#10b981"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-3xl font-bold text-gray-800 leading-none">
                {Math.round(rate)}%
              </p>
              <p className="text-[10px] text-gray-400 mt-1">resolved</p>
            </div>
          </div>

          <div className="w-full flex flex-col gap-2">
            {[
              {
                label: "Resolved",
                value: stats.resolvedCases,
                cls: "bg-emerald-400",
              },
              {
                label: "In progress",
                value: stats.inProgressCases,
                cls: "bg-amber-400",
              },
              { label: "Open", value: stats.openCases, cls: "bg-red-400" },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${row.cls}`} />
                  <span className="text-xs text-gray-500">{row.label}</span>
                </div>
                <span className="text-xs font-semibold text-gray-700 tabular-nums">
                  {row.value ?? 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
