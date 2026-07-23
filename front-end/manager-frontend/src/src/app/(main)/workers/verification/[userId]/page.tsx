"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  fetchWorkerDetail,
  verifyWorker,
  WorkerDetail,
  VerificationStatus,
} from "@/lib/api/workerApi";
import { IconLoader } from "@/providers/Icons";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDateTime(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium">{label}</p>
      <div className="text-sm text-gray-800 font-medium">{value || "—"}</div>
    </div>
  );
}

const STATUS_CONFIG: Record<VerificationStatus, { label: string; bg: string; text: string; dot: string; ring: string }> = {
  PENDING:  { label: "Pending",  bg: "bg-yellow-50",  text: "text-yellow-700", dot: "bg-yellow-400", ring: "ring-yellow-200" },
  APPROVED: { label: "Approved", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", ring: "ring-emerald-200" },
  REJECTED: { label: "Rejected", bg: "bg-red-50",     text: "text-red-700",    dot: "bg-red-500",    ring: "ring-red-200"    },
};

function StatusPill({ status }: { status: VerificationStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ring-1 ${cfg.bg} ${cfg.text} ${cfg.ring}`}>
      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ── Verify Modal ──────────────────────────────────────────────────────────────

function VerifyModal({
  workerId,
  currentStatus,
  onClose,
  onDone,
}: {
  workerId: string;
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
      await verifyWorker(workerId, status, managerId, reason);
      onDone();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-800">Update verification status</p>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">New status</label>
            <div className="flex gap-2">
              {(["APPROVED", "PENDING", "REJECTED"] as VerificationStatus[]).map((opt) => {
                const cfg = STATUS_CONFIG[opt];
                return (
                  <button
                    key={opt}
                    onClick={() => setStatus(opt)}
                    className={`flex-1 py-2 text-xs font-medium rounded-xl border-2 transition-all ${
                      status === opt ? `${cfg.bg} ${cfg.text} border-current` : "border-gray-100 text-gray-500 hover:border-gray-200"
                    }`}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Reason *</label>
            <textarea
              value={reason}
              onChange={(e) => { setReason(e.target.value); setError(""); }}
              placeholder="Explain the reason for this decision..."
              rows={3}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">{error}</p>}
        </div>

        <div className="px-6 pb-5 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="flex-1 py-2.5 bg-black text-white text-sm font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            {saving && <IconLoader />}
            {saving ? "Saving..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function VerificationDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();

  const [data, setData] = useState<WorkerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showVerify, setShowVerify] = useState(false);

  function load() {
    setLoading(true);
    fetchWorkerDetail(userId)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 gap-2 text-gray-400">
        <IconLoader />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <p className="text-sm text-red-500">{error || "Worker not found"}</p>
        <button onClick={() => router.back()} className="text-sm text-gray-500 underline">Go back</button>
      </div>
    );
  }

  const { worker } = data;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const auth: WorkerDetail["authentication"]["auth"] = (data.authentication as any)?.auth ?? data.authentication;
  const ver = worker.verification;
  const currentStatus: VerificationStatus = ver?.newStatus ?? "PENDING";
  const cfg = STATUS_CONFIG[currentStatus];

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors w-fit"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to verification
      </button>

      {/* Hero status card */}
      <div className={`rounded-2xl p-6 border ring-1 ${cfg.bg} ${cfg.ring} flex items-center gap-5`}>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ring-1 ${cfg.ring} ${cfg.bg}`}>
          {currentStatus === "APPROVED" && (
            <svg className={`w-7 h-7 ${cfg.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
          {currentStatus === "REJECTED" && (
            <svg className={`w-7 h-7 ${cfg.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {currentStatus === "PENDING" && (
            <svg className={`w-7 h-7 ${cfg.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <StatusPill status={currentStatus} />
          </div>
          <p className={`text-sm font-medium ${cfg.text}`}>
            {currentStatus === "APPROVED" && "This worker has been approved and can accept assignments."}
            {currentStatus === "PENDING"  && "This worker is awaiting verification review."}
            {currentStatus === "REJECTED" && "This worker's registration has been rejected."}
          </p>
        </div>
        <button
          onClick={() => setShowVerify(true)}
          className="px-4 py-2 bg-white text-gray-800 text-sm font-medium rounded-xl border border-gray-200 hover:bg-gray-50 shadow-sm transition-colors whitespace-nowrap"
        >
          Update status
        </button>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Worker identity */}
        <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl p-6 flex flex-col gap-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Worker</p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-base font-bold shrink-0">
              {(auth.fullName ?? "?").split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)}
            </div>
            <div>
              <p className="text-base font-semibold text-gray-800">{auth.fullName}</p>
              <p className="text-sm text-gray-500">{auth.email}</p>
              {auth.phoneNumber && <p className="text-xs text-gray-400 mt-0.5">{auth.phoneNumber}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
            <InfoRow label="Worker code" value={worker.workerCode} />
            <InfoRow label="Experience" value={`${worker.workExperience}y`} />
            <InfoRow label="Gender" value={worker.gender} />
            <InfoRow label="Date of birth" value={worker.dateOfBirth} />
          </div>
          <button
            onClick={() => router.push(`/workers/${userId}`)}
            className="flex items-center justify-center gap-1.5 w-full py-2 border border-gray-200 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
          >
            View full worker profile
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Verification record */}
        <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl p-6 flex flex-col gap-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Verification record</p>

          {ver ? (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-0.5">
                  <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium">Previous status</p>
                  <StatusPill status={ver.oldStatus as VerificationStatus} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium">Current status</p>
                  <StatusPill status={ver.newStatus as VerificationStatus} />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 flex flex-col gap-4">
                <InfoRow label="Record ID" value={<span className="font-mono text-xs text-gray-600">{ver.id}</span>} />
                <InfoRow label="Worker ID" value={<span className="font-mono text-xs text-gray-600">{ver.workerId ?? worker.workerId}</span>} />
                <InfoRow label="Changed by" value={ver.changeBy} />
                <InfoRow label="Changed at" value={formatDateTime(ver.changeAt)} />
                <div className="flex flex-col gap-0.5">
                  <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium">Reason</p>
                  <p className="text-sm text-gray-800 leading-relaxed">{ver.reason || "—"}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 gap-2 py-8">
              <div className="w-10 h-10 rounded-full bg-yellow-50 ring-1 ring-yellow-200 flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600">No verification record yet</p>
              <p className="text-xs text-gray-400 text-center">This worker has not been reviewed. Use "Update status" to start.</p>
              <button
                onClick={() => setShowVerify(true)}
                className="mt-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
              >
                Review now
              </button>
            </div>
          )}
        </div>
      </div>

      {showVerify && (
        <VerifyModal
          workerId={worker.workerId}
          currentStatus={currentStatus}
          onClose={() => setShowVerify(false)}
          onDone={load}
        />
      )}
    </div>
  );
}
