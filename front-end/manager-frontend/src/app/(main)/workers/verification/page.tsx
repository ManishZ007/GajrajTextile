"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  fetchAllWorkers,
  verifyWorker,
  WorkerEntry,
  VerificationStatus,
} from "@/lib/api/workerApi";
import { IconLoader } from "@/providers/Icons";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getAuth(w: WorkerEntry): Record<string, string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((w.user as any)?.auth ?? w.user) ?? {};
}

function initials(name: string) {
  if (!name) return "?";
  return name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);
}

const STATUS_CONFIG: Record<VerificationStatus, { label: string; bg: string; text: string; dot: string }> = {
  PENDING:  { label: "Pending",  bg: "bg-yellow-100", text: "text-yellow-700", dot: "bg-yellow-400" },
  APPROVED: { label: "Approved", bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  REJECTED: { label: "Rejected", bg: "bg-red-100",    text: "text-red-700",    dot: "bg-red-500"    },
};

function StatusBadge({ status }: { status: VerificationStatus | null | undefined }) {
  const s = (status ?? "PENDING") as VerificationStatus;
  const cfg = STATUS_CONFIG[s] ?? STATUS_CONFIG.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ── Verify Modal ──────────────────────────────────────────────────────────────

function VerifyModal({
  worker,
  auth,
  currentStatus,
  onClose,
  onDone,
}: {
  worker: WorkerEntry["worker"];
  auth: Record<string, string>;
  currentStatus: VerificationStatus;
  onClose: () => void;
  onDone: () => void;
}) {
  const [status, setStatus] = useState<VerificationStatus>(
    currentStatus === "APPROVED" ? "REJECTED" : "APPROVED"
  );
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const managerId =
    typeof window !== "undefined"
      ? (localStorage.getItem("user_id") ?? "manager")
      : "manager";

  async function handleSubmit() {
    if (!reason.trim()) return setError("Reason is required");
    setSaving(true);
    try {
      await verifyWorker(worker.workerId, status, managerId, reason);
      onDone();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  const options: VerificationStatus[] = ["APPROVED", "PENDING", "REJECTED"];

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-800">Update verification</p>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          {/* Worker info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials(auth.fullName)}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">{auth.fullName || "—"}</p>
              <p className="text-[11px] text-gray-500">{auth.email}</p>
            </div>
            <div className="ml-auto">
              <StatusBadge status={currentStatus} />
            </div>
          </div>

          {/* Status select */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">New status</label>
            <div className="flex gap-2">
              {options.map((opt) => {
                const cfg = STATUS_CONFIG[opt];
                return (
                  <button
                    key={opt}
                    onClick={() => setStatus(opt)}
                    className={`flex-1 py-2 text-xs font-medium rounded-xl border-2 transition-all ${
                      status === opt
                        ? `${cfg.bg} ${cfg.text} border-current`
                        : "border-gray-100 text-gray-500 hover:border-gray-200"
                    }`}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Reason *
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError("");
              }}
              placeholder="Explain the reason for this decision..."
              rows={3}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
              {error}
            </p>
          )}
        </div>

        <div className="px-6 pb-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-2.5 bg-black text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <IconLoader />}
            {saving ? "Saving..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Filter = "ALL" | VerificationStatus;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "ALL",      label: "All" },
  { key: "PENDING",  label: "Pending" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
];

export default function WorkerVerificationPage() {
  const router = useRouter();
  const [workers, setWorkers] = useState<WorkerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [search, setSearch] = useState("");
  const [verifyTarget, setVerifyTarget] = useState<WorkerEntry | null>(null);

  function load() {
    setLoading(true);
    fetchAllWorkers()
      .then((d) => setWorkers(d.workers ?? []))
      .catch(() => setWorkers([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  const counts: Record<Filter, number> = {
    ALL:      workers.length,
    PENDING:  workers.filter((w) => (w.worker.verification?.newStatus ?? "PENDING") === "PENDING").length,
    APPROVED: workers.filter((w) => w.worker.verification?.newStatus === "APPROVED").length,
    REJECTED: workers.filter((w) => w.worker.verification?.newStatus === "REJECTED").length,
  };

  const filtered = workers.filter((w) => {
    const auth = getAuth(w);
    const status: VerificationStatus = w.worker.verification?.newStatus ?? "PENDING";
    if (filter !== "ALL" && status !== filter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (auth.fullName ?? "").toLowerCase().includes(q) ||
      (auth.email ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Worker Verification</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Review and approve worker registrations
          </p>
        </div>
        <button
          onClick={() => router.push("/workers")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          All workers
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-3">
        {FILTERS.map(({ key, label }) => {
          const cfg = key === "ALL"
            ? { dot: "bg-gray-400" }
            : STATUS_CONFIG[key as VerificationStatus];
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all text-left backdrop-blur-sm ${
                filter === key
                  ? "bg-white/70 border-gray-300 shadow-sm"
                  : "bg-white/40 border-white/50 hover:bg-white/60"
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${cfg.dot}`} />
              <div>
                <p className="text-xl font-bold text-gray-800 leading-none">{counts[key]}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{label}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter tabs + search */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1 bg-white/40 backdrop-blur-sm border border-white/50 rounded-xl p-1 shrink-0">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                filter === key
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
              <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                filter === key ? "bg-gray-100 text-gray-600" : "bg-white/50 text-gray-400"
              }`}>
                {counts[key]}
              </span>
            </button>
          ))}
        </div>

        <div className="flex-1 bg-white/40 backdrop-blur-sm border border-white/50 rounded-xl px-3 py-2 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-2 text-gray-400">
            <IconLoader />
            <span className="text-sm">Loading workers...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <p className="text-sm font-medium text-gray-500">No workers found</p>
            <p className="text-xs text-gray-400">Try changing the filter or search term</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-gray-400 font-medium border-b border-gray-100">
                <th className="text-left px-5 py-3">Worker</th>
                <th className="text-left px-5 py-3">Code</th>
                <th className="text-left px-5 py-3">Experience</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Changed by</th>
                <th className="text-left px-5 py-3">Reason</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((w) => {
                const auth = getAuth(w);
                const ver = w.worker.verification;
                const status: VerificationStatus = ver?.newStatus ?? "PENDING";
                return (
                  <tr
                    key={w.worker.workerId}
                    onClick={() => router.push(`/workers/verification/${w.worker.userId}`)}
                    className="border-t border-gray-100 hover:bg-white/30 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {initials(auth.fullName)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{auth.fullName || "—"}</p>
                          <p className="text-[11px] text-gray-400">{auth.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs font-mono">{w.worker.workerCode}</td>
                    <td className="px-5 py-3 text-gray-600">{w.worker.workExperience}y</td>
                    <td className="px-5 py-3"><StatusBadge status={status} /></td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{ver?.changeBy || "—"}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs max-w-[180px] truncate">{ver?.reason || "—"}</td>
                    <td className="px-5 py-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); setVerifyTarget(w); }}
                        className="px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
                      >
                        Update status
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {verifyTarget && (
        <VerifyModal
          worker={verifyTarget.worker}
          auth={getAuth(verifyTarget)}
          currentStatus={verifyTarget.worker.verification?.newStatus ?? "PENDING"}
          onClose={() => setVerifyTarget(null)}
          onDone={load}
        />
      )}
    </div>
  );
}
