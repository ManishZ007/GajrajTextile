"use client";
import ManagerPresence from "@/components/ManagerPresence";
import ManagerWorkers from "@/components/ManagerWorkers";
import ManagerOrderDetails from "@/components/ManagerOrderDetails";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  fetchManagerById,
  fetchManagerStats,
  updateManager,
  updateManagerProfile,
  deleteManager,
  changeManagerPassword,
  ManagerUser,
  ManagerStats,
} from "@/lib/api/ownerApi";
import { Dealer } from "@/lib/api/dealerApi";
import { usePageTitle } from "@/hooks/usePagetitle";
import { IconChevronLeft, IconLoader, IconTrash } from "@/providers/Icons";

function formatINR(n: number) {
  return "Rs. " + Number(n).toLocaleString("en-IN");
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
    .slice(0, 2)
    .toUpperCase();
}

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  CONFIRMED: "bg-blue-100 text-blue-700",
  IN_PRODUCTION: "bg-orange-100 text-orange-700",
  READY: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
};

// ── Edit Modal ────────────────────────────────────────────────────────────────

function EditModal({
  manager,
  onClose,
  onSaved,
}: {
  manager: ManagerUser;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    fullName: manager.fullName,
    email: manager.email,
    phoneNumber: manager.phoneNumber ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    setError("");
  }

  async function handleSave() {
    if (!form.fullName.trim()) return setError("Name is required");
    setSaving(true);
    try {
      await updateManager(manager.userId, form);
      onSaved();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  const inp =
    "w-full px-3 py-2 text-sm border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors";
  const lbl = "block text-xs font-medium text-gray-500 mb-1";

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-800">Edit manager</p>
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
            <label className={lbl}>Full name *</label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              className={inp}
            />
          </div>
          <div>
            <label className={lbl}>Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className={inp}
            />
          </div>
          <div>
            <label className={lbl}>Phone</label>
            <input
              type="tel"
              value={form.phoneNumber}
              onChange={(e) => set("phoneNumber", e.target.value)}
              className={inp}
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
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <IconLoader />}
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Change Password Modal ─────────────────────────────────────────────────────

function ChangePasswordModal({
  manager,
  onClose,
}: {
  manager: ManagerUser;
  onClose: () => void;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSave() {
    if (password.length < 8)
      return setError("Password must be at least 8 characters");
    if (password !== confirm) return setError("Passwords do not match");
    setSaving(true);
    setError("");
    try {
      await changeManagerPassword(manager.userId, password);
      setSuccess(true);
      setTimeout(onClose, 1200);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to change password");
    } finally {
      setSaving(false);
    }
  }

  const inp =
    "w-full px-3 py-2 text-sm border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors pr-10";
  const lbl = "block text-xs font-medium text-gray-500 mb-1";

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-800">
              Change password
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{manager.fullName}</p>
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

        <div className="px-6 py-5 flex flex-col gap-4">
          {success ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-700">
                Password updated!
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className={lbl}>New password *</label>
                <div className="relative">
                  <input
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="Min 8 characters"
                    className={inp}
                  />
                  <button
                    type="button"
                    onClick={() => setShow((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {show ? (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.75}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.75}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className={lbl}>Confirm password *</label>
                <input
                  type={show ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => {
                    setConfirm(e.target.value);
                    setError("");
                  }}
                  placeholder="Repeat new password"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
                />
              </div>
              {error && (
                <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
                  {error}
                </p>
              )}
            </>
          )}
        </div>

        {!success && (
          <div className="px-6 pb-5 flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <IconLoader />}
              {saving ? "Updating..." : "Update password"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Edit Profile Modal (manager-service fields) ───────────────────────────────

function EditProfileModal({
  manager,
  userId,
  onClose,
  onSaved,
}: {
  manager: ManagerUser;
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    gender: manager.gender ?? "",
    dateOfBirth: manager.dateOfBirth ?? "",
    roleType: manager.roleType ?? "",
    managerStatus: manager.managerStatus ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    setError("");
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateManagerProfile(userId, {
        gender: form.gender || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        roleType: form.roleType || undefined,
        managerStatus: form.managerStatus || undefined,
      });
      onSaved();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  const sel = "w-full px-3 py-2 text-sm border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-gray-400 transition-colors bg-white";
  const inp = "w-full px-3 py-2 text-sm border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-gray-400 transition-colors";
  const lbl = "block text-xs font-medium text-gray-500 mb-1";

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-800">Edit profile details</p>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className={lbl}>Gender</label>
            <select value={form.gender} onChange={(e) => set("gender", e.target.value)} className={sel}>
              <option value="">— select —</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className={lbl}>Date of birth</label>
            <input type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} className={inp} />
          </div>
          <div>
            <label className={lbl}>Role type</label>
            <select value={form.roleType} onChange={(e) => set("roleType", e.target.value)} className={sel}>
              <option value="">— select —</option>
              <option value="PRODUCT_MANAGER">Product Manager</option>
              <option value="PRODUCTION_MANAGER">Production Manager</option>
            </select>
          </div>
          <div>
            <label className={lbl}>Status</label>
            <select value={form.managerStatus} onChange={(e) => set("managerStatus", e.target.value)} className={sel}>
              <option value="">— select —</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">{error}</p>}
        </div>
        <div className="px-6 pb-5 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {saving && <IconLoader />}
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  color = "gray",
  onClick,
}: {
  label: string;
  value: string | number;
  sub?: string;
  onClick?: () => void;
  color?: "gray" | "blue" | "green" | "orange" | "red";
}) {
  const colors = {
    gray: "bg-gray-50 border-gray-100",
    blue: "bg-blue-50 border-blue-100",
    green: "bg-emerald-50 border-emerald-100",
    orange: "bg-orange-50 border-orange-100",
    red: "bg-red-50 border-red-100",
  };
  const textColors = {
    gray: "text-gray-800",
    blue: "text-blue-700",
    green: "text-emerald-700",
    orange: "text-orange-700",
    red: "text-red-600",
  };
  return (
    <button type="button" onClick={onClick} disabled={!onClick}
      className={`text-left w-full border rounded-2xl p-4 flex flex-col gap-1 ${colors[color]}`}
    >
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      <p className={`text-2xl font-bold ${textColors[color]}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ManagerDetailPage() {
  usePageTitle("Manager Detail");
  const { managerId } = useParams<{ managerId: string }>();
  const router = useRouter();

  const [manager, setManager] = useState<ManagerUser | null>(null);
  const [view,setView] = useState("all");
  function showOrders(filter: string) {setView(filter); setTimeout(()=>document.getElementById("manager-orders")?.scrollIntoView({behavior:"smooth"}),0);}
  const [statsError,setStatsError]=useState("");
  const [stats, setStats] = useState<ManagerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAll();
  }, [managerId]);

  async function loadAll() {
    setLoading(true);
    setStatsLoading(true);
    try {
      const found = await fetchManagerById(managerId);
      setManager(found);

    } catch {
      setManager(null);
    } finally {
      setLoading(false);
    }

    try {
      setStatsError("");
      const statsData = await fetchManagerStats(managerId);
      setStats(statsData);
    } catch {
      setStats(null);
      setStatsError("Order activity unavailable. Check Order service and retry.");
    } finally {
      setStatsLoading(false);
    }
  }

  async function handleDelete() {
    if (
      !confirm(`Delete manager "${manager?.fullName}"? This cannot be undone.`)
    )
      return;
    setDeleting(true);
    try {
      await deleteManager(managerId);
      router.push("/managers");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-gray-400">
        <IconLoader />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  if (!manager) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-sm text-gray-500">Manager not found</p>
        <button
          onClick={() => router.push("/managers")}
          className="text-sm border border-gray-200 rounded-xl px-4 py-2 hover:bg-gray-50"
        >
          Back to managers
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => router.push("/managers")}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <IconChevronLeft />
        </button>
        <div className="flex-1">
          <p className="text-xs text-gray-400">Manager profile</p>
          <p className="font-semibold text-gray-800">{manager.fullName}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEdit(true)}
            className="px-4 py-2 text-sm font-medium border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => setShowChangePassword(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
            Change password
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-500 text-sm font-medium rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {deleting ? <IconLoader /> : <IconTrash />}
            Delete
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
          {error}
        </p>
      )}

      {/* Profile card */}
      <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl p-5 flex flex-col gap-5">
        {/* Top row */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-500 to-gray-700 flex items-center justify-center text-white text-lg font-bold shrink-0">
            {initials(manager.fullName)}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-800 text-base">
              {manager.fullName}
            </p>
            <p className="text-sm text-gray-500">{manager.email}</p>
            {manager.phoneNumber && (
              <p className="text-sm text-gray-400">{manager.phoneNumber}</p>
            )}
          </div>
          <div className="text-right flex flex-col items-end gap-1.5">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              MANAGER
            </span>
            <ManagerPresence id={managerId} />
            {manager.managerStatus && (
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${manager.managerStatus === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}
              >
                Account: {manager.managerStatus}
              </span>
            )}
            <p className="text-xs text-gray-400">
              Joined {formatDate(manager.createdAt)}
            </p>
          </div>
        </div>

        {/* Manager DB details */}
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Profile details</p>
            <button
              onClick={() => setShowEditProfile(true)}
              className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-2.5 py-1 hover:bg-gray-50 transition-colors"
            >
              Edit
            </button>
          </div>
        {(manager.gender || manager.dateOfBirth || manager.roleType) ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
            {manager.gender && (
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                  Gender
                </p>
                <p className="text-sm text-gray-700 mt-0.5 capitalize">
                  {manager.gender.toLowerCase()}
                </p>
              </div>
            )}
            {manager.dateOfBirth && (
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                  Date of birth
                </p>
                <p className="text-sm text-gray-700 mt-0.5">
                  {formatDate(manager.dateOfBirth)}
                </p>
              </div>
            )}
            {manager.roleType && (
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                  Role type
                </p>
                <p className="text-sm text-gray-700 mt-0.5">
                  {manager.roleType.replace("_", " ")}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">No profile details set. Click Edit to add.</p>
        )}
        </div>
      </div>

      <div className="flex justify-end"><button className="underline text-sm" onClick={loadAll}>Refresh details</button></div>
      {statsError && <p role="alert" className="text-red-700">{statsError}</p>}
      <ManagerWorkers id={managerId} />
      {/* Stats grid */}
      {statsLoading ? (
        <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
          <IconLoader /> Loading activity stats...
        </div>
      ) : stats ? (
        <>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Activity overview
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <StatCard
                label="Dealer orders"
                onClick={() => showOrders("dealer")}
                value={stats.totalDealerOrders}
                color="blue"
              />
              <StatCard
                label="Customer orders"
                onClick={() => showOrders("customer")}
                value={stats.totalCustomerOrders}
                color="blue"
              />
              <StatCard
                label="Active orders"
                onClick={() => showOrders("active")}
                value={stats.activeOrders}
                color="orange"
              />
              <StatCard
                label="Delivered orders"
                onClick={() => showOrders("delivered")}
                value={stats.deliveredOrders}
                color="green"
              />
              <div
                className="cursor-pointer hover:ring-2 hover:ring-gray-300 rounded-2xl transition-all"
              >
                <StatCard
                  label="Dealers registered"
                  onClick={() => router.push(`/managers/${managerId}/dealers`)}
                  value={stats.totalDealers}
                  color="gray"
                  sub="Click to view all"
                />
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Financial summary
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <StatCard
                label="Total order value"
                onClick={() => showOrders("value")}
                value={formatINR(stats.totalOrderValue)}
                color="gray"
              />
              <StatCard
                label="Amount collected"
                onClick={() => showOrders("collected")}
                value={stats.totalCollected === null ? "Unavailable" : formatINR(stats.totalCollected)}
                color="green"
              />
              <StatCard
                label="Pending balance"
                onClick={() => showOrders("balance")}
                value={stats.totalBalance === null ? "Unavailable" : formatINR(stats.totalBalance)}
                color={(stats.totalBalance ?? 0) > 0 ? "red" : "green"}
              />
            </div>
          </div>

          {!stats.financialAvailable && <p role="alert" className="text-amber-700 text-sm">Payment details unavailable. Collected amount and balance cannot be confirmed.</p>}
          <ManagerOrderDetails rows={stats.orders || []} view={view} onView={setView} />
          {/* Recent dealer orders */}
          {stats.recentDealerOrders.length > 0 && (
            <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-700">
                  Recent dealer orders
                </p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Order #
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Dealer
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Amount
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentDealerOrders.map((o) => (
                    <tr
                      key={o.orderNumber}
                      className="border-t border-gray-50 hover:bg-white/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">
                        {o.orderNumber}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {o.dealerName}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[o.status] ?? "bg-gray-100 text-gray-600"}`}
                        >
                          {o.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800">
                        {formatINR(o.totalAmount)}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {formatDate(o.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <p className="text-sm text-gray-400">Activity stats unavailable.</p>
      )}

      {showEdit && manager && (
        <EditModal
          manager={manager}
          onClose={() => setShowEdit(false)}
          onSaved={loadAll}
        />
      )}
      {showEditProfile && manager && (
        <EditProfileModal
          manager={manager}
          userId={managerId}
          onClose={() => setShowEditProfile(false)}
          onSaved={loadAll}
        />
      )}
      {showChangePassword && manager && (
        <ChangePasswordModal
          manager={manager}
          onClose={() => setShowChangePassword(false)}
        />
      )}
    </div>
  );
}
