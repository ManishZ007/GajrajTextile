"use client";

import { useEffect, useState } from "react";
import { usePageTitle } from "@/hooks/usePagetitle";
import { useRole } from "@/hooks/useRole";
import {
  fetchSupportCases,
  createCase,
  updateCase,
  deleteCase,
} from "@/lib/api/supportApi";
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconEmptyBox,
  IconEye,
  IconEdit,
  IconLoader,
  IconPlus,
  IconSearch,
  IconTrash,
} from "@/providers/Icons";

// ── Types ──────────────────────────────────────────────────────────────────────

interface SupportCase {
  id: string;
  orderId: string;
  customerId: string;
  issueType: string;
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  handledBy?: string;
  resolutionNote?: string;
  createdAt: string;
  updatedAt?: string;
}

interface PagedResponse {
  content: SupportCase[];
  totalElements: number;
  totalPages: number;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const PAGE_SIZE = 15;

const ISSUE_TYPES = [
  { value: "", label: "All types" },
  { value: "ORDER_DELAY", label: "Order delay" },
  { value: "DAMAGE", label: "Damage" },
  { value: "PAYMENT", label: "Payment issue" },
  { value: "QUALITY", label: "Quality issue" },
  { value: "OTHER", label: "Other" },
];

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
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function shortId(id: string) {
  if (!id) return "—";
  return id.length > 12 ? "…" + id.slice(-10) : id;
}

function truncate(str: string, len = 80) {
  if (!str) return "—";
  return str.length > len ? str.slice(0, len) + "…" : str;
}

// ── View Modal ─────────────────────────────────────────────────────────────────

function ViewModal({ c, onClose }: { c: SupportCase; onClose: () => void }) {
  const status = STATUS_BADGE[c.status] ?? STATUS_BADGE.OPEN;
  const issueCls = ISSUE_TYPE_BADGE[c.issueType] ?? "bg-gray-100 text-gray-600";
  const issueLabel = ISSUE_TYPE_LABEL[c.issueType] ?? c.issueType;

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${issueCls}`}>{issueLabel}</span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${status.cls}`}>{status.label}</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            {([
              ["Ticket ID", shortId(c.id)],
              ["Order ID", c.orderId || "—"],
              ["Customer ID", c.customerId || "—"],
              ["Created", formatDate(c.createdAt)],
              ...(c.handledBy ? [["Handled by", c.handledBy]] : []),
              ...(c.updatedAt ? [["Updated", formatDate(c.updatedAt)]] : []),
            ] as [string, string][]).map(([k, v]) => (
              <div key={k}>
                <p className="text-[10px] font-medium text-[#616a7c] uppercase tracking-wide">{k}</p>
                <p className="text-sm text-gray-800 mt-0.5 font-mono">{v}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="text-[10px] font-medium text-[#616a7c] uppercase tracking-wide mb-1">Description</p>
            <p className="text-sm text-gray-700 leading-relaxed">{c.description || "—"}</p>
          </div>

          {c.resolutionNote && (
            <div>
              <p className="text-[10px] font-medium text-[#616a7c] uppercase tracking-wide mb-1">Resolution note</p>
              <p className="text-sm text-gray-700 leading-relaxed">{c.resolutionNote}</p>
            </div>
          )}
        </div>

        <div className="px-6 pb-5 border-t border-gray-100 pt-4 shrink-0">
          <button onClick={onClose} className="w-full py-2.5 border border-gray-200 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
}

// ── Update Modal ───────────────────────────────────────────────────────────────

function UpdateModal({ c, onClose, onSaved }: { c: SupportCase; onClose: () => void; onSaved: () => void }) {
  const { userId } = useRole();
  const [status, setStatus] = useState<SupportCase["status"]>(c.status);
  const [handledBy, setHandledBy] = useState(userId ?? c.handledBy ?? "");
  const [resolutionNote, setResolutionNote] = useState(c.resolutionNote ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setError("");
    if (status === "RESOLVED" && !resolutionNote.trim()) {
      setError("Resolution note is required when marking as resolved");
      return;
    }
    setSaving(true);
    try {
      await updateCase(c.id, {
        status,
        handledBy: handledBy.trim() || undefined,
        resolutionNote: resolutionNote.trim() || undefined,
      });
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update ticket");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-800">Update ticket status</p>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          <div>
            <p className="text-[10px] font-medium text-gray-400 mb-1">Ticket</p>
            <p className="text-xs font-mono text-gray-600">{shortId(c.id)} — Order {c.orderId}</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Status *</label>
            <div className="relative">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as SupportCase["status"])}
                className="w-full pl-3 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-800 appearance-none focus:outline-none focus:border-gray-400 transition-colors"
              >
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="RESOLVED">Resolved</option>
              </select>
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"><IconChevronDown /></span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Handled by</label>
            <input
              type="text"
              value={handledBy}
              onChange={(e) => setHandledBy(e.target.value)}
              placeholder="Your name or ID"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Resolution note {status === "RESOLVED" && <span className="text-red-400">*</span>}
            </label>
            <textarea
              rows={3}
              value={resolutionNote}
              onChange={(e) => { setResolutionNote(e.target.value); setError(""); }}
              placeholder={status === "RESOLVED" ? "Describe how this was resolved..." : "Optional note..."}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">{error}</p>}
        </div>

        <div className="px-6 pb-5 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <IconLoader />}{saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Create Modal ───────────────────────────────────────────────────────────────

function CreateModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [orderId, setOrderId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setError("");
    if (!orderId.trim()) { setError("Order ID is required"); return; }
    if (!customerId.trim()) { setError("Customer ID is required"); return; }
    if (!issueType) { setError("Select an issue type"); return; }
    if (!description.trim()) { setError("Description is required"); return; }
    setSaving(true);
    try {
      await createCase({ orderId: orderId.trim(), customerId: customerId.trim(), issueType, description: description.trim(), status: "OPEN" });
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create ticket");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-800">New support ticket</p>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Order ID *</label>
              <input
                type="text"
                value={orderId}
                onChange={(e) => { setOrderId(e.target.value); setError(""); }}
                placeholder="Order ID"
                autoFocus
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Customer ID *</label>
              <input
                type="text"
                value={customerId}
                onChange={(e) => { setCustomerId(e.target.value); setError(""); }}
                placeholder="Customer ID"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Issue type *</label>
            <div className="relative">
              <select
                value={issueType}
                onChange={(e) => { setIssueType(e.target.value); setError(""); }}
                className="w-full pl-3 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-800 appearance-none focus:outline-none focus:border-gray-400 transition-colors"
              >
                <option value="">Select type...</option>
                {ISSUE_TYPES.slice(1).map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"><IconChevronDown /></span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Description *</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => { setDescription(e.target.value); setError(""); }}
              placeholder="Describe the issue in detail..."
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">{error}</p>}
        </div>

        <div className="px-6 pb-5 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <IconLoader />}{saving ? "Creating..." : "Create ticket"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm ─────────────────────────────────────────────────────────────

function DeleteConfirm({ c, onClose, onConfirm, deleting }: { c: SupportCase; onClose: () => void; onConfirm: () => void; deleting: boolean }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="px-6 py-5 flex flex-col gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mx-auto text-red-500">
            <IconTrash />
          </div>
          <p className="text-center text-sm font-semibold text-gray-800">Delete this ticket?</p>
          <p className="text-center text-xs text-gray-500">Order {c.orderId} — {truncate(c.description, 60)}</p>
        </div>
        <div className="px-6 pb-5 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {deleting && <IconLoader />}{deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function SupportAll() {
  const title = usePageTitle();

  const [cases, setCases] = useState<SupportCase[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0 });

  const [statusFilter, setStatusFilter] = useState("");
  const [issueTypeFilter, setIssueTypeFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [viewCase, setViewCase] = useState<SupportCase | null>(null);
  const [updateTarget, setUpdateTarget] = useState<SupportCase | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SupportCase | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(0); }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Summary counts
  useEffect(() => {
    fetchSupportCases({ size: 1000 })
      .then((data: PagedResponse) => {
        const all: SupportCase[] = data.content ?? [];
        setStats({
          total: all.length,
          open: all.filter((c) => c.status === "OPEN").length,
          inProgress: all.filter((c) => c.status === "IN_PROGRESS").length,
          resolved: all.filter((c) => c.status === "RESOLVED").length,
        });
      })
      .catch(() => {});
  }, []);

  // Paginated fetch
  useEffect(() => {
    setLoading(true);
    fetchSupportCases({
      page,
      size: PAGE_SIZE,
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(issueTypeFilter ? { issueType: issueTypeFilter } : {}),
      ...(search ? { search } : {}),
    })
      .then((data: PagedResponse) => {
        setCases(data.content ?? []);
        setTotalElements(data.totalElements ?? 0);
        setTotalPages(data.totalPages ?? 0);
      })
      .catch(() => setCases([]))
      .finally(() => setLoading(false));
  }, [page, statusFilter, issueTypeFilter, search]);

  function loadStats() {
    fetchSupportCases({ size: 1000 })
      .then((data: PagedResponse) => {
        const all: SupportCase[] = data.content ?? [];
        setStats({
          total: all.length,
          open: all.filter((c) => c.status === "OPEN").length,
          inProgress: all.filter((c) => c.status === "IN_PROGRESS").length,
          resolved: all.filter((c) => c.status === "RESOLVED").length,
        });
      }).catch(() => {});
  }

  function loadPage() {
    setLoading(true);
    fetchSupportCases({ page, size: PAGE_SIZE,
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(issueTypeFilter ? { issueType: issueTypeFilter } : {}),
      ...(search ? { search } : {}),
    })
      .then((data: PagedResponse) => {
        setCases(data.content ?? []);
        setTotalElements(data.totalElements ?? 0);
        setTotalPages(data.totalPages ?? 0);
      })
      .catch(() => setCases([]))
      .finally(() => setLoading(false));
  }

  function refresh() { loadStats(); loadPage(); }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCase(deleteTarget.id);
      setDeleteTarget(null);
      refresh();
    } catch {
      // keep dialog open
    } finally {
      setDeleting(false);
    }
  }

  const pills = [
    { key: "", label: "All", count: stats.total, dot: null },
    { key: "OPEN", label: "Open", count: stats.open, dot: "bg-red-400" },
    { key: "IN_PROGRESS", label: "In progress", count: stats.inProgress, dot: "bg-amber-400" },
    { key: "RESOLVED", label: "Resolved", count: stats.resolved, dot: "bg-emerald-400" },
  ];

  const start = totalElements === 0 ? 0 : page * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE + cases.length, totalElements);

  return (
    <div className="flex flex-col gap-5">
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
        <button
          onClick={() => setCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
        >
          <IconPlus />New ticket
        </button>
      </div>

      {/* ── Stat pills ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {pills.map((pill) => {
          const isActive = statusFilter === pill.key;
          return (
            <button
              key={pill.key}
              onClick={() => { setStatusFilter(pill.key); setPage(0); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                isActive
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white/40 backdrop-blur-sm border-white/50 text-gray-600 hover:bg-white/60"
              }`}
            >
              {pill.dot && (
                <span className={`w-2 h-2 rounded-full shrink-0 ${isActive ? "bg-white/70" : pill.dot}`} />
              )}
              {pill.label}
              <span className={`text-[11px] font-bold ${isActive ? "text-gray-300" : "text-gray-400"}`}>{pill.count}</span>
            </button>
          );
        })}
      </div>

      {/* ── Filter bar ────────────────────────────────────────────────────────── */}
      <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <span className="text-gray-400 shrink-0"><IconSearch /></span>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by order ID or customer ID..."
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
          />
          {searchInput && (
            <button onClick={() => setSearchInput("")} className="text-xs text-gray-400 hover:text-gray-600 transition-colors shrink-0">Clear</button>
          )}
        </div>

        <div className="w-px h-5 bg-gray-200" />

        <div className="relative flex items-center gap-1">
          <span className="text-xs text-gray-400 shrink-0">Type</span>
          <select
            value={issueTypeFilter}
            onChange={(e) => { setIssueTypeFilter(e.target.value); setPage(0); }}
            className="pl-2 pr-7 py-1 text-sm bg-transparent text-gray-700 appearance-none cursor-pointer focus:outline-none"
          >
            {ISSUE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-gray-400"><IconChevronDown /></span>
        </div>

        {(issueTypeFilter || statusFilter || search) && (
          <>
            <div className="w-px h-5 bg-gray-200" />
            <button
              onClick={() => { setIssueTypeFilter(""); setStatusFilter(""); setSearchInput(""); setSearch(""); setPage(0); }}
              className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
            >
              Clear all
            </button>
          </>
        )}
      </div>

      {/* ── Table ────────────────────────────────────────────────────────────── */}
      <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
            <IconLoader /><span className="text-sm">Loading tickets...</span>
          </div>
        ) : cases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <IconEmptyBox />
            <p className="text-lg font-medium text-gray-500">No tickets found</p>
            <p className="text-sm text-gray-400">Try adjusting the filters or create a new ticket</p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-gray-400 font-medium border-b border-gray-100">
                  <th className="text-left px-4 py-3">Ticket ID</th>
                  <th className="text-left px-4 py-3">Order ID</th>
                  <th className="text-left px-4 py-3">Customer</th>
                  <th className="text-left px-4 py-3">Issue</th>
                  <th className="text-left px-4 py-3">Description</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => {
                  const status = STATUS_BADGE[c.status] ?? STATUS_BADGE.OPEN;
                  const issueCls = ISSUE_TYPE_BADGE[c.issueType] ?? "bg-gray-100 text-gray-600";
                  const issueLabel = ISSUE_TYPE_LABEL[c.issueType] ?? c.issueType;
                  const canUpdate = c.status === "OPEN" || c.status === "IN_PROGRESS";
                  const canDelete = c.status === "OPEN";
                  return (
                    <tr key={c.id} className="border-t border-gray-100 hover:bg-white/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-mono text-gray-400">{shortId(c.id)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-mono text-gray-700">{c.orderId}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-mono text-gray-600">{shortId(c.customerId)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${issueCls}`}>{issueLabel}</span>
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        <p className="text-xs text-gray-600 truncate" title={c.description}>{c.description || "—"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${status.cls}`}>{status.label}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{formatDate(c.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setViewCase(c)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="View">
                            <IconEye />
                          </button>
                          {canUpdate && (
                            <button onClick={() => setUpdateTarget(c)} className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors" title="Update status">
                              <IconEdit />
                            </button>
                          )}
                          {canDelete && (
                            <button onClick={() => setDeleteTarget(c)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete">
                              <IconTrash />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
              <p className="text-xs text-[#616a7c]">
                Showing {start}–{end} of {totalElements} ticket{totalElements !== 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors ${page === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <IconChevronLeft />Previous
                </button>
                {totalPages <= 7 ? (
                  Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      onClick={() => setPage(n - 1)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${n === page + 1 ? "bg-black text-white" : "text-gray-600 hover:bg-gray-100"}`}
                    >
                      {n}
                    </button>
                  ))
                ) : (
                  <span className="px-3 py-1.5 text-xs font-medium text-gray-600">{page + 1} / {totalPages}</span>
                )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors ${page >= totalPages - 1 ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  Next<IconChevronRight />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Modals ────────────────────────────────────────────────────────────── */}
      {viewCase && <ViewModal c={viewCase} onClose={() => setViewCase(null)} />}
      {updateTarget && (
        <UpdateModal
          c={updateTarget}
          onClose={() => setUpdateTarget(null)}
          onSaved={() => { setUpdateTarget(null); refresh(); }}
        />
      )}
      {createModal && <CreateModal onClose={() => setCreateModal(false)} onSaved={refresh} />}
      {deleteTarget && (
        <DeleteConfirm
          c={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          deleting={deleting}
        />
      )}
    </div>
  );
}
