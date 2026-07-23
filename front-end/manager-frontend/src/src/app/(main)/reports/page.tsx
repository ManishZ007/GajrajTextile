"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageTitle } from "@/hooks/usePagetitle";
import { useRole } from "@/hooks/useRole";
import {
  fetchAllReports,
  updateReport,
  deleteReport,
  ownerApproveReport,
  ownerRejectReport,
} from "@/lib/api/reportApi";
import {
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconChevronDown,
  IconEdit,
  IconEmptyBox,
  IconEye,
  IconLoader,
  IconPlus,
  IconTrash,
  IconWorkers,
  IconPackage,
} from "@/providers/Icons";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Report {
  id: string;
  reportType: "WORKER_PERFORMANCE" | "INVENTORY_UPDATE" | "CUSTOMER_ISSUE";
  description: string;
  reportedBy: string;
  readStatus: "READ" | "UNREAD";
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

interface PagedResponse {
  content: Report[];
  totalElements: number;
  totalPages: number;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

const TYPE_BADGE: Record<string, string> = {
  WORKER_PERFORMANCE: "bg-purple-100 text-purple-700",
  INVENTORY_UPDATE: "bg-blue-100 text-blue-700",
  CUSTOMER_ISSUE: "bg-red-100 text-red-700",
};

const TYPE_LABEL: Record<string, string> = {
  WORKER_PERFORMANCE: "Worker performance",
  INVENTORY_UPDATE: "Inventory update",
  CUSTOMER_ISSUE: "Customer issue",
};

const APPROVAL_BADGE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
};

const REPORT_TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "WORKER_PERFORMANCE", label: "Worker performance" },
  { value: "INVENTORY_UPDATE", label: "Inventory update" },
  { value: "CUSTOMER_ISSUE", label: "Customer issue" },
];

const APPROVAL_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function truncate(str: string, len = 120) {
  if (!str) return "—";
  return str.length > len ? str.slice(0, len) + "…" : str;
}

// ── Edit Modal ─────────────────────────────────────────────────────────────────

const EDIT_TYPES = [
  {
    value: "WORKER_PERFORMANCE",
    label: "Worker performance",
    border: "border-purple-400",
    bg: "bg-purple-50/60",
    text: "text-purple-700",
  },
  {
    value: "INVENTORY_UPDATE",
    label: "Inventory update",
    border: "border-blue-400",
    bg: "bg-blue-50/60",
    text: "text-blue-700",
  },
  {
    value: "CUSTOMER_ISSUE",
    label: "Customer issue",
    border: "border-red-400",
    bg: "bg-red-50/60",
    text: "text-red-700",
  },
];

function EditModal({
  report,
  onClose,
  onSaved,
}: {
  report: Report;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [editType, setEditType] = useState(report.reportType);
  const [editDesc, setEditDesc] = useState(report.description);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setError("");
    if (!editType) {
      setError("Select a report type");
      return;
    }
    if (!editDesc.trim()) {
      setError("Description is required");
      return;
    }
    setSaving(true);
    try {
      await updateReport(report.id, {
        reportType: editType,
        description: editDesc.trim(),
        reportedBy: report.reportedBy,
      });
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update report");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-800">Edit report</p>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">
              Report type
            </p>
            <div className="grid grid-cols-3 gap-2">
              {EDIT_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setEditType(t.value as Report["reportType"])}
                  className={`border-l-4 ${t.border} rounded-xl px-3 py-2.5 text-left text-xs font-medium transition-colors ${
                    editType === t.value
                      ? `${t.bg} ${t.text}`
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">
              Description
            </p>
            <textarea
              rows={6}
              value={editDesc}
              onChange={(e) => {
                setEditDesc(e.target.value);
                setError("");
              }}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
              {error}
            </p>
          )}
        </div>

        <div className="px-6 pb-5 flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <IconLoader />}
            {saving ? "Saving..." : "Update report"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Detail Modal ───────────────────────────────────────────────────────────────

function DetailModal({
  report,
  onClose,
  onEdit,
  onDelete,
}: {
  report: Report;
  onClose: () => void;
  onEdit: (r: Report) => void;
  onDelete: (r: Report) => void;
}) {
  const isUnread = report.readStatus === "UNREAD";

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${TYPE_BADGE[report.reportType] ?? "bg-gray-100 text-gray-600"}`}
            >
              {TYPE_LABEL[report.reportType] ?? report.reportType}
            </span>
            {isUnread && (
              <span className="flex items-center gap-1 text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                Unread
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto flex-1">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {report.description || "—"}
          </p>

          <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-medium text-[#616a7c] uppercase tracking-wide mb-1">
                Reported by
              </p>
              <p className="text-sm text-gray-700">
                {report.reportedBy || "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium text-[#616a7c] uppercase tracking-wide mb-1">
                Date
              </p>
              <p className="text-sm text-gray-700">
                {formatDate(report.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium text-[#616a7c] uppercase tracking-wide mb-1">
                Read status
              </p>
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${isUnread ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}
              >
                {isUnread ? "Unread" : "Read"}
              </span>
            </div>
            <div>
              <p className="text-[10px] font-medium text-[#616a7c] uppercase tracking-wide mb-1">
                Approval
              </p>
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${APPROVAL_BADGE[report.approvalStatus] ?? "bg-gray-100 text-gray-600"}`}
              >
                {report.approvalStatus}
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 pb-5 flex items-center gap-2 border-t border-gray-100 pt-4 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          {isUnread && (
            <>
              <button
                onClick={() => {
                  onClose();
                  onEdit(report);
                }}
                className="flex-1 py-2.5 border border-amber-200 text-sm font-medium text-amber-700 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors flex items-center justify-center gap-1.5"
              >
                <IconEdit />
                Edit
              </button>
              <button
                onClick={() => {
                  onClose();
                  onDelete(report);
                }}
                className="flex-1 py-2.5 border border-red-200 text-sm font-medium text-red-700 bg-red-50 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5"
              >
                <IconTrash />
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm ─────────────────────────────────────────────────────────────

function DeleteConfirm({
  report,
  onClose,
  onConfirm,
  deleting,
}: {
  report: Report;
  onClose: () => void;
  onConfirm: () => void;
  deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="px-6 py-5 flex flex-col gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <IconTrash />
          </div>
          <p className="text-center text-sm font-semibold text-gray-800">
            Delete this report?
          </p>
          <p className="text-center text-xs text-gray-500">
            {truncate(report.description, 80)}
          </p>
        </div>
        <div className="px-6 pb-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {deleting && <IconLoader />}
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ReportsAll() {
  const title = usePageTitle();
  const router = useRouter();
  const { isOwner, userId } = useRole();

  const [reports, setReports] = useState<Report[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    approved: 0,
    pending: 0,
    workerPerf: 0,
    inventoryUpdate: 0,
  });

  const [typeFilter, setTypeFilter] = useState("");
  const [approvalFilter, setApprovalFilter] = useState("");
  const [readFilter, setReadFilter] = useState("");

  const [detailReport, setDetailReport] = useState<Report | null>(null);
  const [editReport, setEditReport] = useState<Report | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Report | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [approving, setApproving] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Report | null>(null);
  const [rejecting, setRejecting] = useState(false);

  // Summary fetch for stat counts (once on mount)
  useEffect(() => {
    fetchAllReports({ size: 1000 })
      .then((data: PagedResponse) => {
        const all: Report[] = data.content ?? [];
        console.log(data);
        setStats({
          total: all.length,
          unread: all.filter((r) => r.readStatus === "UNREAD").length,
          approved: all.filter((r) => r.approvalStatus === "APPROVED").length,
          pending: all.filter((r) => r.approvalStatus === "PENDING").length,
          workerPerf: all.filter((r) => r.reportType === "WORKER_PERFORMANCE")
            .length,
          inventoryUpdate: all.filter(
            (r) => r.reportType === "INVENTORY_UPDATE",
          ).length,
        });
      })
      .catch(() => {});
  }, []);

  // Paginated fetch with filters
  useEffect(() => {
    setLoading(true);
    fetchAllReports({
      page,
      size: PAGE_SIZE,
      ...(typeFilter ? { reportType: typeFilter } : {}),
      ...(approvalFilter ? { approvalStatus: approvalFilter } : {}),
      ...(readFilter ? { readStatus: readFilter } : {}),
    })
      .then((data: PagedResponse) => {
        setReports(data.content ?? []);
        setTotalElements(data.totalElements ?? 0);
        setTotalPages(data.totalPages ?? 0);
      })
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, [page, typeFilter, approvalFilter, readFilter]);

  function refresh() {
    // Re-fetch both summary and current page
    fetchAllReports({ size: 1000 })
      .then((data: PagedResponse) => {
        const all: Report[] = data.content ?? [];
        setStats({
          total: all.length,
          unread: all.filter((r) => r.readStatus === "UNREAD").length,
          approved: all.filter((r) => r.approvalStatus === "APPROVED").length,
          pending: all.filter((r) => r.approvalStatus === "PENDING").length,
          workerPerf: all.filter((r) => r.reportType === "WORKER_PERFORMANCE")
            .length,
          inventoryUpdate: all.filter(
            (r) => r.reportType === "INVENTORY_UPDATE",
          ).length,
        });
      })
      .catch(() => {});

    setLoading(true);
    fetchAllReports({
      page,
      size: PAGE_SIZE,
      ...(typeFilter ? { reportType: typeFilter } : {}),
      ...(approvalFilter ? { approvalStatus: approvalFilter } : {}),
      ...(readFilter ? { readStatus: readFilter } : {}),
    })
      .then((data: PagedResponse) => {
        setReports(data.content ?? []);
        setTotalElements(data.totalElements ?? 0);
        setTotalPages(data.totalPages ?? 0);
      })
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }

  function applyPill(pill: string) {
    setPage(0);
    switch (pill) {
      case "ALL":
        setTypeFilter("");
        setApprovalFilter("");
        setReadFilter("");
        break;
      case "UNREAD":
        setReadFilter("UNREAD");
        setTypeFilter("");
        setApprovalFilter("");
        break;
      case "APPROVED":
        setApprovalFilter("APPROVED");
        setTypeFilter("");
        setReadFilter("");
        break;
      case "PENDING":
        setApprovalFilter("PENDING");
        setTypeFilter("");
        setReadFilter("");
        break;
      case "WORKER_PERFORMANCE":
        setTypeFilter("WORKER_PERFORMANCE");
        setApprovalFilter("");
        setReadFilter("");
        break;
      case "INVENTORY_UPDATE":
        setTypeFilter("INVENTORY_UPDATE");
        setApprovalFilter("");
        setReadFilter("");
        break;
    }
  }

  const activePill =
    readFilter === "UNREAD"
      ? "UNREAD"
      : approvalFilter === "APPROVED"
        ? "APPROVED"
        : approvalFilter === "PENDING"
          ? "PENDING"
          : typeFilter === "WORKER_PERFORMANCE"
            ? "WORKER_PERFORMANCE"
            : typeFilter === "INVENTORY_UPDATE"
              ? "INVENTORY_UPDATE"
              : "ALL";

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteReport(deleteTarget.id);
      setDeleteTarget(null);
      refresh();
    } catch {
      // keep dialog open on error
    } finally {
      setDeleting(false);
    }
  }

  async function handleApprove(id: string) {
    setApproving(id);
    try {
      await ownerApproveReport(id);
      refresh();
    } catch {
      // silently fail
    } finally {
      setApproving(null);
    }
  }

  async function handleReject() {
    if (!rejectTarget) return;
    setRejecting(true);
    try {
      await ownerRejectReport(rejectTarget.id);
      setRejectTarget(null);
      refresh();
    } catch {
      // keep dialog open
    } finally {
      setRejecting(false);
    }
  }

  console.log(reports);

  const pills = [
    { key: "ALL", label: "All reports", count: stats.total },
    { key: "UNREAD", label: "Unread", count: stats.unread },
    { key: "APPROVED", label: "Approved", count: stats.approved },
    { key: "PENDING", label: "Pending", count: stats.pending },
    {
      key: "WORKER_PERFORMANCE",
      label: "Worker performance",
      count: stats.workerPerf,
    },
    {
      key: "INVENTORY_UPDATE",
      label: "Inventory updates",
      count: stats.inventoryUpdate,
    },
  ];

  const start = totalElements === 0 ? 0 : page * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE + reports.length, totalElements);

  return (
    <div className="flex flex-col gap-5">
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
        <button
          onClick={() => router.push("/reports/create")}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
        >
          <IconPlus />
          New report
        </button>
      </div>

      {/* ── Stat pills ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {pills.map((pill) => {
          const isActive = activePill === pill.key;
          const iconNode =
            pill.key === "WORKER_PERFORMANCE" ? (
              <IconWorkers />
            ) : pill.key === "INVENTORY_UPDATE" ? (
              <IconPackage />
            ) : null;
          return (
            <button
              key={pill.key}
              onClick={() => applyPill(pill.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                isActive
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white/40 backdrop-blur-sm border-white/50 text-gray-600 hover:bg-white/60"
              }`}
            >
              {iconNode && (
                <span className={isActive ? "text-white" : "text-gray-400"}>
                  {iconNode}
                </span>
              )}
              {pill.label}
              <span
                className={`text-[11px] font-bold ${isActive ? "text-gray-300" : "text-gray-400"}`}
              >
                {pill.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Filter bar ────────────────────────────────────────────────────────── */}
      <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl px-4 py-3 flex flex-wrap items-center gap-4">
        {/* Type filter */}
        <div className="relative flex items-center gap-1">
          <span className="text-xs text-gray-400 shrink-0">Type</span>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(0);
            }}
            className="pl-2 pr-7 py-1 text-sm bg-transparent text-gray-700 appearance-none cursor-pointer focus:outline-none"
          >
            {REPORT_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-gray-400">
            <IconChevronDown />
          </span>
        </div>

        <div className="w-px h-5 bg-gray-200" />

        {/* Read filter */}
        <div className="relative flex items-center gap-1">
          <span className="text-xs text-gray-400 shrink-0">Read</span>
          <select
            value={readFilter}
            onChange={(e) => {
              setReadFilter(e.target.value);
              setPage(0);
            }}
            className="pl-2 pr-7 py-1 text-sm bg-transparent text-gray-700 appearance-none cursor-pointer focus:outline-none"
          >
            <option value="">All</option>
            <option value="UNREAD">Unread</option>
            <option value="READ">Read</option>
          </select>
          <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-gray-400">
            <IconChevronDown />
          </span>
        </div>

        <div className="w-px h-5 bg-gray-200" />

        {/* Approval filter */}
        <div className="relative flex items-center gap-1">
          <span className="text-xs text-gray-400 shrink-0">Approval</span>
          <select
            value={approvalFilter}
            onChange={(e) => {
              setApprovalFilter(e.target.value);
              setPage(0);
            }}
            className="pl-2 pr-7 py-1 text-sm bg-transparent text-gray-700 appearance-none cursor-pointer focus:outline-none"
          >
            {APPROVAL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-gray-400">
            <IconChevronDown />
          </span>
        </div>

        {(typeFilter || approvalFilter || readFilter) && (
          <>
            <div className="w-px h-5 bg-gray-200" />
            <button
              onClick={() => {
                setTypeFilter("");
                setApprovalFilter("");
                setReadFilter("");
                setPage(0);
              }}
              className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
            >
              Clear filters
            </button>
          </>
        )}
      </div>

      {/* ── Table ────────────────────────────────────────────────────────────── */}
      <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
            <IconLoader />
            <span className="text-sm">Loading reports...</span>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <IconEmptyBox />
            <p className="text-lg font-medium text-gray-500">
              No reports found
            </p>
            <p className="text-sm text-gray-400">
              Try adjusting the filters or create a new report
            </p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-gray-400 font-medium border-b border-gray-100">
                  <th className="text-left px-5 py-3">Type</th>
                  <th className="text-left px-5 py-3">Description</th>
                  <th className="text-left px-5 py-3">Reported by</th>
                  <th className="text-left px-5 py-3">Read</th>
                  <th className="text-left px-5 py-3">Approval</th>
                  <th className="text-left px-5 py-3">Date</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr
                    key={r.id}
                    className="border-t border-gray-100 hover:bg-white/30 transition-colors cursor-pointer"
                    onClick={() => setDetailReport(r)}
                  >
                    <td className="px-5 py-3">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${TYPE_BADGE[r.reportType] ?? "bg-gray-100 text-gray-600"}`}
                      >
                        {TYPE_LABEL[r.reportType] ??
                          r.reportType?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3 max-w-70">
                      <p className="text-xs text-gray-700 line-clamp-2 leading-relaxed">
                        {r.description || "—"}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {r.reportedBy || "—"}
                    </td>
                    <td className="px-5 py-3">
                      {r.readStatus === "UNREAD" ? (
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                          <span className="text-xs font-medium text-blue-600">
                            Unread
                          </span>
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Read</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${APPROVAL_BADGE[r.approvalStatus] ?? "bg-gray-100 text-gray-600"}`}
                      >
                        {r.approvalStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {formatDate(r.createdAt)}
                    </td>
                    <td className="px-5 py-3">
                      <div
                        className="flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setDetailReport(r)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="View"
                        >
                          <IconEye />
                        </button>
                        {isOwner && r.approvalStatus === "PENDING" && (
                          <>
                            <button
                              onClick={() => handleApprove(r.id)}
                              disabled={approving === r.id}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                              title="Approve"
                            >
                              <IconCheck />
                            </button>
                            <button
                              onClick={() => setRejectTarget(r)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Reject"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </>
                        )}
                        {r.readStatus === "UNREAD" && (
                          <>
                            <button
                              onClick={() => setEditReport(r)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                              title="Edit"
                            >
                              <IconEdit />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(r)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete"
                            >
                              <IconTrash />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
              <p className="text-xs text-[#616a7c]">
                Showing {start}–{end} of {totalElements} report
                {totalElements !== 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors ${page === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <IconChevronLeft />
                  Previous
                </button>
                {totalPages <= 7 ? (
                  Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (n) => (
                      <button
                        key={n}
                        onClick={() => setPage(n - 1)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${n === page + 1 ? "bg-black text-white" : "text-gray-600 hover:bg-gray-100"}`}
                      >
                        {n}
                      </button>
                    ),
                  )
                ) : (
                  <span className="px-3 py-1.5 text-xs font-medium text-gray-600">
                    {page + 1} / {totalPages}
                  </span>
                )}
                <button
                  onClick={() =>
                    setPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                  disabled={page >= totalPages - 1}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors ${page >= totalPages - 1 ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  Next
                  <IconChevronRight />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Modals ────────────────────────────────────────────────────────────── */}
      {detailReport && (
        <DetailModal
          report={detailReport}
          onClose={() => setDetailReport(null)}
          onEdit={(r) => setEditReport(r)}
          onDelete={(r) => setDeleteTarget(r)}
        />
      )}

      {editReport && (
        <EditModal
          report={editReport}
          onClose={() => setEditReport(null)}
          onSaved={() => {
            setEditReport(null);
            refresh();
          }}
        />
      )}

      {deleteTarget && (
        <DeleteConfirm
          report={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          deleting={deleting}
        />
      )}

      {isOwner && rejectTarget && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="px-6 py-5 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                <svg
                  className="w-5 h-5 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <p className="text-center text-sm font-semibold text-gray-800">
                Reject this report?
              </p>
              <p className="text-center text-xs text-gray-500">
                Are you sure you want to reject this report?
              </p>
            </div>
            <div className="px-6 pb-5 flex gap-2">
              <button
                onClick={() => setRejectTarget(null)}
                className="flex-1 py-2.5 border border-gray-200 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={rejecting}
                className="flex-1 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {rejecting && <IconLoader />}
                {rejecting ? "Rejecting..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
