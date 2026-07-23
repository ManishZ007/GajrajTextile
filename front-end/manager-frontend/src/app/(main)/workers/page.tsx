"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageTitle } from "@/hooks/usePagetitle";
import {
  IconEdit,
  IconEmptyBox,
  IconLoader,
  IconPlus,
  IconSearch,
} from "@/providers/Icons";
import {
  fetchAllWorkers,
  createWorker,
  updateWorker,
  deleteWorker,
  WorkerEntry,
} from "@/lib/api/workerApi";

// ── Helpers ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getAuth(w: WorkerEntry): any {
  return (w.user as any)?.auth ?? w.user;
}

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function initials(name: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ── Create / Edit Modal ───────────────────────────────────────────────────────

interface WorkerFormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  workExperience: string;
  gender: string;
  dateOfBirth: string;
}

function WorkerModal({
  mode,
  initial,
  onClose,
  onSave,
}: {
  mode: "create" | "edit";
  initial?: WorkerEntry;
  onClose: () => void;
  onSave: (data: WorkerFormData) => Promise<void>;
}) {
  const initialAuth = initial ? getAuth(initial) : null;
  const [form, setForm] = useState<WorkerFormData>({
    fullName: initialAuth?.fullName ?? "",
    email: initialAuth?.email ?? "",
    phoneNumber: initialAuth?.phoneNumber ?? "",
    password: "",
    workExperience: "",
    gender: "",
    dateOfBirth: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(field: keyof WorkerFormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setError("");
  }

  async function handleSubmit() {
    if (!form.fullName.trim()) return setError("Full name is required");
    if (!form.email.trim()) return setError("Email is required");
    if (mode === "create" && !form.password.trim())
      return setError("Password is required");
    if (form.password && form.password.length < 6)
      return setError("Password must be at least 6 characters");

    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save worker");
    } finally {
      setSaving(false);
    }
  }

  const baseFields = [
    {
      label: "Full name *",
      field: "fullName" as const,
      placeholder: "e.g. Ramesh Patil",
      type: "text",
    },
    {
      label: "Email *",
      field: "email" as const,
      placeholder: "worker@example.com",
      type: "email",
    },
    {
      label: "Phone number",
      field: "phoneNumber" as const,
      placeholder: "10-digit number",
      type: "tel",
    },
    {
      label:
        mode === "create" ? "Password *" : "New password (leave blank to keep)",
      field: "password" as const,
      placeholder: "Min 6 characters",
      type: "password",
    },
  ];

  const profileFields =
    mode === "create"
      ? [
          {
            label: "Work experience (years)",
            field: "workExperience" as const,
            placeholder: "e.g. 3",
            type: "number",
          },
          {
            label: "Date of birth",
            field: "dateOfBirth" as const,
            placeholder: "YYYY-MM-DD",
            type: "date",
          },
        ]
      : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-800">
            {mode === "create" ? "Add new worker" : "Edit worker"}
          </p>
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
          {baseFields.map(({ label, field, placeholder, type }) => (
            <div key={field}>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                {label}
              </label>
              <input
                type={type}
                value={form[field]}
                onChange={(e) => set(field, e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>
          ))}

          {mode === "create" && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Gender
                </label>
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
              {profileFields.map(({ label, field, placeholder, type }) => (
                <div key={field}>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    {label}
                  </label>
                  <input
                    type={type}
                    value={form[field]}
                    onChange={(e) => set(field, e.target.value)}
                    placeholder={placeholder}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
                  />
                </div>
              ))}
            </>
          )}

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
            {saving
              ? "Saving..."
              : mode === "create"
                ? "Create worker"
                : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────

function DeleteModal({
  worker,
  onClose,
  onConfirm,
}: {
  worker: WorkerEntry;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete worker");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
          <svg
            className="w-6 h-6 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-800">Delete worker?</p>
          <p className="text-xs text-gray-500 mt-1">
            <span className="font-medium">{getAuth(worker)?.fullName}</span> (
            {getAuth(worker)?.email}) will be permanently removed.
          </p>
        </div>
        {error && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-xl text-center">
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {deleting && <IconLoader />}
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WorkersPage() {
  const title = usePageTitle();
  const router = useRouter();
  const [workers, setWorkers] = useState<WorkerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<WorkerEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WorkerEntry | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchAllWorkers();
      setWorkers(data.workers);
    } catch {
      setWorkers([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = workers.filter((w) => {
    if (!search) return true;
    const auth = getAuth(w);
    if (!auth) return true;
    const q = search.toLowerCase();
    return (
      (auth.fullName ?? "").toLowerCase().includes(q) ||
      (auth.email ?? "").toLowerCase().includes(q) ||
      (auth.phoneNumber ?? "").includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
        >
          <IconPlus />
          Add worker
        </button>
      </div>

      {/* Stat card */}
      <div className="flex gap-3">
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/40 backdrop-blur-sm border border-white/50">
          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <div>
            <p className="text-xl font-bold text-gray-800 leading-none">
              {workers.length}
            </p>

            <p className="text-xs text-gray-500 mt-0.5">Total workers</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl px-4 py-3 flex items-center gap-3">
        <span className="text-gray-400 shrink-0">
          <IconSearch />
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email or phone..."
          className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
            <IconLoader />
            <span className="text-sm">Loading workers...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-300">
            <IconEmptyBox />
            {workers.length === 0 ? (
              <>
                <p className="text-lg font-medium text-gray-500">
                  No workers yet
                </p>
                <p className="text-sm text-gray-400">
                  Add your first worker to get started
                </p>
                <button
                  onClick={() => setShowCreate(true)}
                  className="mt-2 flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
                >
                  <IconPlus />
                  Add worker
                </button>
              </>
            ) : (
              <p className="text-lg font-medium text-gray-500">
                No workers match your search
              </p>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-gray-400 font-medium border-b border-gray-100">
                <th className="text-left px-5 py-3">Worker</th>
                <th className="text-left px-5 py-3">Email</th>
                <th className="text-left px-5 py-3">Phone</th>
                <th className="text-left px-5 py-3">Joined</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((w) => {
                const auth = getAuth(w) ?? {};
                return (
                <tr
                  key={w.worker.workerId}
                  onClick={() => router.push(`/workers/${w.worker.userId}`)}
                  className="border-t border-gray-100 hover:bg-white/30 transition-colors cursor-pointer"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {initials(auth.fullName)}
                      </div>
                      <div>
                        <span className="font-medium text-gray-800">
                          {auth.fullName}
                        </span>
                        <p className="text-[11px] text-gray-400">
                          Code: {w.worker.workerCode}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{auth.email}</td>
                  <td className="px-5 py-3 text-gray-500">{auth.phoneNumber || "—"}</td>
                  <td className="px-5 py-3 text-gray-500">{formatDate(auth.createdAt)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        title="Edit"
                        onClick={() => setEditTarget(w)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <IconEdit />
                      </button>
                      <button
                        title="Delete"
                        onClick={() => setDeleteTarget(w)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && (
        <WorkerModal
          mode="create"
          onClose={() => setShowCreate(false)}
          onSave={async (data) => {
            await createWorker(data);
            await load();
          }}
        />
      )}
      {editTarget && (
        <WorkerModal
          mode="edit"
          initial={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={async (data) => {
            await updateWorker(editTarget.worker.userId, editTarget.worker.workerId, {
              fullName: data.fullName,
              email: data.email,
              phoneNumber: data.phoneNumber,
              workExperience: data.workExperience ? parseInt(data.workExperience) : undefined,
              gender: data.gender,
              dateOfBirth: data.dateOfBirth,
            });
            await load();
          }}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          worker={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={async () => {
            await deleteWorker(deleteTarget.worker.userId);
            await load();
          }}
        />
      )}
    </div>
  );
}
