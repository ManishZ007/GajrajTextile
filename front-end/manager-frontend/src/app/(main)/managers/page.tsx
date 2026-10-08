"use client";
import ManagerPresence from "@/components/ManagerPresence";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/hooks/useRole";
import {
  fetchManagers,
  createManager,
  deleteManager,
  ManagerUser,
} from "@/lib/api/ownerApi";
import { usePageTitle } from "@/hooks/usePagetitle";
import { IconEdit, IconLoader, IconPlus, IconTrash } from "@/providers/Icons";

// ── Create Manager Modal ──────────────────────────────────────────────────────

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    passwordHash: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    setError("");
  }

  async function handleCreate() {
    if (!form.fullName.trim()) return setError("Full name is required");
    if (!form.email.trim()) return setError("Email is required");
    if (!form.passwordHash || form.passwordHash.length < 8)
      return setError("Password must be at least 8 characters");
    setSaving(true);
    try {
      await createManager({ ...form, role: "MANAGER" });
      onCreated();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create manager");
    } finally {
      setSaving(false);
    }
  }

  const inp = "w-full px-3 py-2 text-sm border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors";
  const lbl = "block text-xs font-medium text-gray-500 mb-1";

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-800">Add new manager</p>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className={lbl}>Full name *</label>
            <input type="text" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="Rahul Sharma" className={inp} />
          </div>
          <div>
            <label className={lbl}>Email *</label>
            <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="manager@gajraj.com" className={inp} />
          </div>
          <div>
            <label className={lbl}>Phone</label>
            <input type="tel" value={form.phoneNumber} onChange={(e) => set("phoneNumber", e.target.value)} placeholder="9876543210" className={inp} />
          </div>
          <div>
            <label className={lbl}>Password *</label>
            <input type="password" value={form.passwordHash} onChange={(e) => set("passwordHash", e.target.value)} placeholder="Min 8 characters" className={inp} />
          </div>
          {error && <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">{error}</p>}
        </div>

        <div className="px-6 pb-5 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleCreate} disabled={saving} className="flex-1 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {saving && <IconLoader />}
            {saving ? "Creating..." : "Create manager"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function ManagersPage() {
  usePageTitle("Managers");
  const router = useRouter();
  const { isOwner, loading: roleLoading } = useRole() as { isOwner: boolean; loading?: boolean };
  const [managers, setManagers] = useState<ManagerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loadError,setLoadError]=useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);setLoadError("");
    try {
      setManagers(await fetchManagers());
    } catch {
      setLoadError("Unable to load managers. Refresh to retry.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(m: ManagerUser) {
    if (!confirm(`Delete manager "${m.fullName}"? This cannot be undone.`)) return;
    setDeletingId(m.userId);
    try {
      await deleteManager(m.userId);
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  }

  const filtered = managers.filter((m) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return m.fullName.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Managers</h1>
          <p className="text-xs text-gray-400 mt-0.5">{managers.length} total managers</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl w-60 focus:outline-none focus:border-gray-400 bg-white/60 text-gray-700 placeholder-gray-400"
          />
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-black transition-colors"
          >
            <IconPlus />
            Add manager
          </button>
        </div>
      </div>

      {loadError && <p role="alert" className="text-red-700">{loadError}</p>}
      {/* Table */}
      <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40 gap-2 text-gray-400">
            <IconLoader /><span className="text-sm">Loading...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-400">
            <p className="text-sm">{search ? "No managers match your search" : "No managers yet"}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Manager</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Joined</th>
                <th className="px-4 py-3 text-left text-xs text-gray-400">Presence</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr
                  key={m.userId}
                  onClick={() => router.push(`/managers/${m.userId}`)}
                  className="border-t border-gray-50 hover:bg-white/50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-500 to-gray-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {initials(m.fullName)}
                      </div>
                      <span className="font-medium text-gray-800">{m.fullName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{m.email}</td>
                  <td className="px-4 py-3 text-gray-500">{m.phoneNumber || "—"}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(m.createdAt)}</td>
                  <td className="px-4 py-3"><ManagerPresence id={m.userId} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => router.push(`/managers/${m.userId}`)}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <IconEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(m)}
                        disabled={deletingId === m.userId}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                      >
                        {deletingId === m.userId ? <IconLoader /> : <IconTrash />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && (
        <CreateModal onClose={() => setShowCreate(false)} onCreated={load} />
      )}
    </div>
  );
}
