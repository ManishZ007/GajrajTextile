"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePageTitle } from "@/hooks/usePagetitle";
import { createReport } from "@/lib/api/reportApi";
import { IconChevronLeft, IconLoader } from "@/providers/Icons";

// ── Constants ──────────────────────────────────────────────────────────────────

const REPORT_TYPES = [
  {
    value: "WORKER_PERFORMANCE",
    label: "Worker performance",
    desc: "Performance evaluation, productivity, or attendance",
    borderColor: "border-purple-400",
    bgSelected: "bg-purple-50/60",
    ringSelected: "ring-2 ring-purple-300",
    textSelected: "text-purple-700",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    value: "INVENTORY_UPDATE",
    label: "Inventory update",
    desc: "Stock adjustment, restock, or discrepancy",
    borderColor: "border-blue-400",
    bgSelected: "bg-blue-50/60",
    ringSelected: "ring-2 ring-blue-300",
    textSelected: "text-blue-700",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    value: "CUSTOMER_ISSUE",
    label: "Customer issue",
    desc: "Complaint, refund request, or quality concern",
    borderColor: "border-red-400",
    bgSelected: "bg-red-50/60",
    ringSelected: "ring-2 ring-red-300",
    textSelected: "text-red-700",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
  },
] as const;

const PLACEHOLDER: Record<string, string> = {
  WORKER_PERFORMANCE: "Describe the worker's performance. Include metrics, attendance, quality of work, and any observations...",
  INVENTORY_UPDATE: "Describe the inventory change. Include item names, quantities before and after, and reason for the adjustment...",
  CUSTOMER_ISSUE: "Describe the customer issue. Include order ID (if any), nature of the complaint, and any action taken...",
  "": "Select a report type above to get started...",
};

const TEMPLATES: Record<string, string> = {
  WORKER_PERFORMANCE: `Worker Name: [Name]
Period: [Month Year]

Performance Summary:
- Units completed: [X]
- Quality rating: [X/5]
- Attendance: [X days present / X days total]

Observations:
[Write observations here]

Recommended Action:
[Write recommendation here]`,

  INVENTORY_UPDATE: `Inventory Report
Date: [Date]

Updated Items:
- [Item name]: [Old qty] → [New qty] (Reason: [reason])
- [Item name]: [Old qty] → [New qty] (Reason: [reason])

Net Stock Value Change: [±₹X]

Notes:
[Additional notes here]`,

  CUSTOMER_ISSUE: `Customer Issue Report
Date: [Date]
Order ID: [Order ID or N/A]

Customer: [Name / Contact]
Issue Type: [Complaint / Refund / Quality]

Description:
[Describe the issue in detail]

Action Taken:
[What was done or proposed to resolve this]

Resolution Status: [Resolved / Pending / Escalated]`,
};

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ReportsCreate() {
  const title = usePageTitle();
  const router = useRouter();

  const [reportType, setReportType] = useState<"WORKER_PERFORMANCE" | "INVENTORY_UPDATE" | "CUSTOMER_ISSUE" | "">("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setError("");
    if (!reportType) { setError("Please select a report type"); return; }
    if (!description.trim()) { setError("Description is required"); return; }

    setSubmitting(true);
    try {
      await createReport({
        reportType,
        description: description.trim(),
        reportedBy: "MANAGER",
      });
      router.push("/reports");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create report");
    } finally {
      setSubmitting(false);
    }
  }

  function insertTemplate() {
    if (!reportType) return;
    setDescription(TEMPLATES[reportType] ?? "");
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-white/50 transition-colors"
        >
          <IconChevronLeft />
        </button>
        <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
      </div>

      {/* ── Type selector ─────────────────────────────────────────────────────── */}
      <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl px-6 py-5 flex flex-col gap-3">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Report type *</p>
        <div className="grid grid-cols-3 gap-3">
          {REPORT_TYPES.map((t) => {
            const isSelected = reportType === t.value;
            return (
              <button
                key={t.value}
                onClick={() => { setReportType(t.value); setError(""); }}
                className={`border-l-4 ${t.borderColor} rounded-xl p-4 text-left transition-all ${
                  isSelected
                    ? `${t.bgSelected} ${t.ringSelected}`
                    : "bg-white/30 hover:bg-white/60 ring-0"
                }`}
              >
                <span className={`block mb-2 ${isSelected ? t.textSelected : "text-gray-400"}`}>
                  {t.icon}
                </span>
                <p className={`text-sm font-semibold ${isSelected ? t.textSelected : "text-gray-700"}`}>
                  {t.label}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">{t.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Description ──────────────────────────────────────────────────────── */}
      <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl px-6 py-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Description *</p>
          {reportType && (
            <button
              onClick={insertTemplate}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Insert monthly template
            </button>
          )}
        </div>
        <textarea
          rows={14}
          value={description}
          onChange={(e) => { setDescription(e.target.value); setError(""); }}
          placeholder={PLACEHOLDER[reportType]}
          className="w-full bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none resize-none leading-relaxed"
        />
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <p className="text-[11px] text-gray-400">
            {description.length} character{description.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* ── Error ────────────────────────────────────────────────────────────── */}
      {error && (
        <p className="text-sm text-red-500 bg-red-50/60 border border-red-100 px-4 py-3 rounded-2xl">{error}</p>
      )}

      {/* ── Actions ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex-1 py-3 border border-gray-200 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex-1 py-3 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting && <IconLoader />}
          {submitting ? "Submitting..." : "Submit report"}
        </button>
      </div>
    </div>
  );
}
