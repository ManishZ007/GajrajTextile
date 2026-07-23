"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageTitle } from "@/hooks/usePagetitle";
import {
  fetchCustomers,
  fetchCustomerProfile,
  updateCustomerProfile,
  deleteCustomer,
} from "@/lib/api/customerApi";
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconEdit,
  IconEmptyBox,
  IconEye,
  IconLoader,
  IconSearch,
  IconTrash,
} from "@/providers/Icons";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Customer {
  id: string;
  userId: string;
  profileImageUrl?: string;
  gender?: string;
  dateOfBirth?: string;
  createdAt: string;
  updatedAt?: string;
  // enriched from auth service
  fullName?: string;
  email?: string;
  phoneNumber?: string;
}

interface PagedResponse {
  content: Customer[];
  totalElements: number;
  totalPages: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const GENDER_FILTER = [
  { value: "", label: "All genders" },
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
];

const PAGE_SIZE = 15;

// ── Edit Modal ─────────────────────────────────────────────────────────────────

function EditModal({
  customer,
  onClose,
  onSaved,
}: {
  customer: Customer;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [gender, setGender] = useState(customer.gender ?? "");
  const [dob, setDob] = useState(customer.dateOfBirth ?? "");
  const [imageUrl, setImageUrl] = useState(customer.profileImageUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      await updateCustomerProfile(customer.id, {
        gender: gender || undefined,
        date_of_birth: dob || undefined,
        profile_image_url: imageUrl || undefined,
      });
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-800">Edit customer</p>
            <p className="text-[11px] text-gray-400 font-mono mt-0.5 truncate max-w-[220px]">
              {customer.userId}
            </p>
          </div>
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
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Gender</label>
            <div className="relative">
              <select
                value={gender}
                onChange={(e) => { setGender(e.target.value); setError(""); }}
                className="w-full pl-3 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl appearance-none focus:outline-none focus:border-gray-400 transition-colors"
              >
                <option value="">Not specified</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                <IconChevronDown />
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Date of birth</label>
            <input
              type="date"
              value={dob}
              onChange={(e) => { setDob(e.target.value); setError(""); }}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Profile image URL</label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => { setImageUrl(e.target.value); setError(""); }}
              placeholder="https://..."
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 transition-colors"
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
            className="flex-1 py-2.5 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <IconLoader />}
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm ─────────────────────────────────────────────────────────────

function DeleteConfirm({
  customer,
  onClose,
  onConfirm,
  deleting,
}: {
  customer: Customer;
  onClose: () => void;
  onConfirm: () => void;
  deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="px-6 py-5 flex flex-col gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mx-auto text-red-500">
            <IconTrash />
          </div>
          <p className="text-center text-sm font-semibold text-gray-800">Delete this customer?</p>
          <p className="text-center text-xs text-gray-500 font-mono break-all px-2">
            {customer.userId}
          </p>
          <p className="text-center text-xs text-red-400">
            This will permanently delete the customer and all their addresses.
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

export default function CustomersPage() {
  const title = usePageTitle();
  const router = useRouter();

  // All enriched customers (loaded once, filtered client-side)
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  const [genderFilter, setGenderFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [editTarget, setEditTarget] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);
  function refresh() { setRefreshKey((k) => k + 1); }

  // Load ALL customers once, enrich with names from auth service
  useEffect(() => {
    setLoading(true);
    fetchCustomers({ page: 0, size: 1000 })
      .then(async (data: PagedResponse) => {
        const all: Customer[] = data.content ?? [];
        const enriched = await Promise.all(
          all.map(async (c) => {
            if (!c.userId) return c;
            try {
              const prof = await fetchCustomerProfile(c.userId);
              const auth = prof?.authentication?.auth;
              return { ...c, fullName: auth?.fullName, email: auth?.email, phoneNumber: auth?.phoneNumber };
            } catch {
              return c;
            }
          })
        );
        setAllCustomers(enriched);
      })
      .catch(() => setAllCustomers([]))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  // Client-side filter + paginate
  const q = searchInput.trim().toLowerCase();
  const filtered = allCustomers.filter((c) => {
    const matchesSearch = !q
      || c.fullName?.toLowerCase().includes(q)
      || c.email?.toLowerCase().includes(q)
      || c.phoneNumber?.includes(q);
    const matchesGender = !genderFilter || c.gender === genderFilter;
    return matchesSearch && matchesGender;
  });

  const totalElements = filtered.length;
  const totalPages = Math.ceil(totalElements / PAGE_SIZE);
  const customers = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCustomer(deleteTarget.id);
      setDeleteTarget(null);
      refresh();
    } catch {
      // keep dialog open
    } finally {
      setDeleting(false);
    }
  }

  const start = totalElements === 0 ? 0 : page * PAGE_SIZE + 1;
  const end = Math.min((page + 1) * PAGE_SIZE, totalElements);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
        <span className="text-sm text-[#616a7c]">
          {totalElements} customer{totalElements !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Filter bar */}
      <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <span className="text-gray-400 shrink-0">
            <IconSearch />
          </span>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); setPage(0); }}
            placeholder="Search by name, email or phone..."
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors shrink-0"
            >
              Clear
            </button>
          )}
        </div>

        <div className="w-px h-5 bg-gray-200" />

        <div className="relative flex items-center gap-1.5">
          <span className="text-xs text-gray-400 shrink-0">Gender</span>
          <select
            value={genderFilter}
            onChange={(e) => { setGenderFilter(e.target.value); setPage(0); }}
            className="pl-2 pr-7 py-1 text-sm bg-transparent text-gray-700 appearance-none cursor-pointer focus:outline-none"
          >
            {GENDER_FILTER.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-gray-400">
            <IconChevronDown />
          </span>
        </div>

        {(genderFilter || searchInput) && (
          <>
            <div className="w-px h-5 bg-gray-200" />
            <button
              onClick={() => { setGenderFilter(""); setSearchInput(""); setPage(0); }}
              className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
            >
              Clear all
            </button>
          </>
        )}
      </div>

      {/* Table */}
      <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
            <IconLoader />
            <span className="text-sm">Loading customers...</span>
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <IconEmptyBox />
            <p className="text-lg font-medium text-gray-500">No customers found</p>
            <p className="text-sm text-gray-400">
              {searchInput || genderFilter ? "Try adjusting the filters" : "No customers registered yet"}
            </p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-gray-400 font-medium border-b border-gray-100">
                  <th className="text-left px-5 py-3">Customer</th>
                  <th className="text-left px-4 py-3">Gender</th>
                  <th className="text-left px-4 py-3">Date of birth</th>
                  <th className="text-left px-4 py-3">Joined</th>
                  <th className="text-left px-4 py-3">Last updated</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr
                    key={c.id}
                    className="border-t border-gray-100 hover:bg-white/30 transition-colors group"
                  >
                    {/* Avatar + userId */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {c.profileImageUrl ? (
                          <img
                            src={c.profileImageUrl}
                            alt=""
                            className="w-9 h-9 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shrink-0">
                            <svg
                              className="w-4 h-4 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={1.5}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                            </svg>
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate max-w-[200px]">
                            {c.fullName || <span className="text-gray-400 text-xs">Unknown</span>}
                          </p>
                          <p className="text-[10px] text-gray-400 truncate max-w-[200px] mt-0.5">
                            {c.email || c.userId?.slice(0, 20) + "…"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Gender */}
                    <td className="px-4 py-3">
                      {c.gender ? (
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            c.gender === "MALE"
                              ? "bg-blue-50 text-blue-700"
                              : c.gender === "FEMALE"
                              ? "bg-pink-50 text-pink-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {c.gender.charAt(0) + c.gender.slice(1).toLowerCase()}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>

                    {/* DOB */}
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {c.dateOfBirth ? formatDate(c.dateOfBirth) : <span className="text-gray-300">—</span>}
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {formatDate(c.createdAt)}
                    </td>

                    {/* Updated */}
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {c.updatedAt ? formatDate(c.updatedAt) : <span className="text-gray-300">—</span>}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => router.push(`/customers/${c.id}`)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="View full profile"
                        >
                          <IconEye />
                        </button>
                        <button
                          onClick={() => setEditTarget(c)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          title="Edit customer"
                        >
                          <IconEdit />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(c)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete customer"
                        >
                          <IconTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
              <p className="text-xs text-[#616a7c]">
                Showing {start}–{end} of {totalElements} customer{totalElements !== 1 ? "s" : ""}
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
                  <span className="px-3 py-1.5 text-xs font-medium text-gray-600">
                    {page + 1} / {totalPages}
                  </span>
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

      {/* Modals */}
      {editTarget && (
        <EditModal
          customer={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => { setEditTarget(null); refresh(); }}
        />
      )}
      {deleteTarget && (
        <DeleteConfirm
          customer={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          deleting={deleting}
        />
      )}
    </div>
  );
}
