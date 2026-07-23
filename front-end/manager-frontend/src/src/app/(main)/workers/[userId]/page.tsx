"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchWorkerDetail, updateWorker, deleteWorker, WorkerDetail, WorkerEntry } from "@/lib/api/workerApi";
import { IconLoader } from "@/providers/Icons";

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatDateTime(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium">{label}</p>
      <p className="text-sm text-gray-800 font-medium">{value || "—"}</p>
    </div>
  );
}

function VerificationBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    APPROVED: "bg-emerald-100 text-emerald-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    REJECTED: "bg-red-100 text-red-700",
  };
  return (
    <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${map[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

// ── Edit Modal ────────────────────────────────────────────────────────────────

function EditModal({ auth, userId, worker, onClose, onSaved }: {
  auth: WorkerDetail["authentication"]["auth"];
  userId: string;
  worker: WorkerDetail["worker"];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    fullName: auth.fullName ?? "",
    email: auth.email ?? "",
    phoneNumber: auth.phoneNumber ?? "",
    gender: worker.gender ?? "",
    dateOfBirth: worker.dateOfBirth ?? "",
    workExperience: String(worker.workExperience ?? ""),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setError("");
  }

  async function handleSubmit() {
    if (!form.fullName.trim()) return setError("Full name is required");
    if (!form.email.trim()) return setError("Email is required");
    setSaving(true);
    try {
      await updateWorker(userId, worker.workerId, {
        fullName: form.fullName,
        email: form.email,
        phoneNumber: form.phoneNumber,
        gender: form.gender,
        dateOfBirth: form.dateOfBirth,
        workExperience: form.workExperience ? parseInt(form.workExperience) : undefined,
      });
      onSaved();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const textFields: { label: string; field: keyof typeof form; type: string; placeholder: string }[] = [
    { label: "Full name *", field: "fullName", type: "text", placeholder: "e.g. Ramesh Patil" },
    { label: "Email *", field: "email", type: "email", placeholder: "worker@example.com" },
    { label: "Phone number", field: "phoneNumber", type: "tel", placeholder: "10-digit number" },
    { label: "Work experience (years)", field: "workExperience", type: "number", placeholder: "e.g. 3" },
    { label: "Date of birth", field: "dateOfBirth", type: "date", placeholder: "YYYY-MM-DD" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
          <p className="text-sm font-semibold text-gray-800">Edit worker</p>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          {textFields.map(({ label, field, type, placeholder }) => (
            <div key={field}>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
              <input
                type={type}
                value={form[field]}
                onChange={(e) => set(field, e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Gender</label>
            <select
              value={form.gender}
              onChange={(e) => set("gender", e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-gray-400 transition-colors"
            >
              <option value="">Select gender</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">{error}</p>}
        </div>
        <div className="px-6 pb-5 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="flex-1 py-2.5 bg-black text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {saving && <IconLoader />}
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Modal ──────────────────────────────────────────────────────────────

function DeleteModal({ name, workerId, onClose, onDeleted }: {
  name: string; workerId: string; onClose: () => void; onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteWorker(workerId);
      onDeleted();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-800">Delete worker?</p>
          <p className="text-xs text-gray-500 mt-1"><span className="font-medium">{name}</span> will be permanently removed.</p>
        </div>
        {error && <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-xl text-center">{error}</p>}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {deleting && <IconLoader />}
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WorkerDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();

  const [data, setData] = useState<WorkerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

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
        <span className="text-sm">Loading worker...</span>
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

  const { worker, authentication } = data;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const auth: WorkerDetail["authentication"]["auth"] = (authentication as any)?.auth ?? authentication;

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Back */}
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors w-fit">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to workers
      </button>

      {/* Header */}
      <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold shrink-0">
          {(auth.fullName ?? "?").split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)}
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-gray-800">{auth.fullName}</h1>
          <p className="text-sm text-gray-500">{auth.email}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">{auth.role}</span>
            <span className="text-[11px] text-gray-400">Code: {worker.workerCode}</span>
            {worker.verification && <VerificationBadge status={worker.verification.newStatus} />}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowEdit(true)} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
          <button onClick={() => setShowDelete(true)} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 border border-red-100 rounded-xl hover:bg-red-50 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>
      </div>

      {/* Account info */}
      <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl p-6">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Account info</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <InfoRow label="Full name" value={auth.fullName} />
          <InfoRow label="Email" value={auth.email} />
          <InfoRow label="Phone" value={auth.phoneNumber} />
          <InfoRow label="Member since" value={formatDate(auth.createdAt)} />
        </div>
      </div>

      {/* Worker profile */}
      <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl p-6">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Worker profile</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
          <InfoRow label="Worker code" value={String(worker.workerCode)} />
          <InfoRow label="Gender" value={worker.gender} />
          <InfoRow label="Date of birth" value={formatDate(worker.dateOfBirth)} />
          <InfoRow label="Work experience" value={`${worker.workExperience} year${worker.workExperience !== 1 ? "s" : ""}`} />
          <InfoRow label="Profile created" value={formatDate(worker.createdAt)} />
          <InfoRow label="Last updated" value={formatDate(worker.updatedAt)} />
        </div>
      </div>

      {/* Verification */}
      {worker.verification && (
        <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl p-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Verification</p>
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-0.5">
              <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium">Status</p>
              <VerificationBadge status={worker.verification.newStatus} />
            </div>
            <InfoRow label="Changed by" value={worker.verification.changeBy} />
            <InfoRow label="Changed at" value={formatDateTime(worker.verification.changeAt)} />
            {worker.verification.reason && <InfoRow label="Reason" value={worker.verification.reason} />}
          </div>
        </div>
      )}

      {/* Assignments */}
      {worker.assignments?.length > 0 && (
        <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl p-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Assignments ({worker.assignments.length})
          </p>
          <div className="flex flex-col gap-4">
            {worker.assignments.map((a) => (
              <div key={a.id} className="border border-gray-100 rounded-xl p-4 bg-white/50 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-800">Order #{a.orderId}</p>
                  <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${
                    a.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700" :
                    a.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>{a.status}</span>
                </div>

                {a.progress && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[11px] text-gray-500">Progress — {a.progress.currentStep}</p>
                      <p className="text-[11px] font-medium text-gray-700">{a.progress.progressPercent}%</p>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${a.progress.progressPercent}%` }} />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {a.performance && (
                    <>
                      <InfoRow label="Points earned" value={String(a.performance.pointGet)} />
                      <InfoRow label="Penalty points" value={String(a.performance.penaltyPoints)} />
                    </>
                  )}
                  {a.materialUsage?.material && (
                    <>
                      <InfoRow label="Zari used" value={String(a.materialUsage.material.zari)} />
                      <InfoRow label="Silk used" value={String(a.materialUsage.material.silk)} />
                      <InfoRow label="Zari type" value={a.materialUsage.material.zariType} />
                    </>
                  )}
                  <InfoRow label="Assigned date" value={formatDateTime(a.assignedDate)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showEdit && (
        <EditModal auth={auth} userId={worker.userId} worker={worker} onClose={() => setShowEdit(false)} onSaved={load} />
      )}
      {showDelete && (
        <DeleteModal name={auth.fullName} workerId={worker.userId} onClose={() => setShowDelete(false)} onDeleted={() => router.push("/workers")} />
      )}
    </div>
  );
}
