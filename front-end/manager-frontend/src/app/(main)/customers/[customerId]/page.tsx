"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  fetchCustomerById,
  fetchCustomerProfile,
  updateCustomerProfile,
  addCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
  fetchOrdersByUser,
  AddressPayload,
} from "@/lib/api/customerApi";
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconEdit,
  IconEmptyBox,
  IconLoader,
  IconPlus,
  IconTrash,
} from "@/providers/Icons";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Address {
  id: number;
  label: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

interface AuthInfo {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

interface CustomerDetail {
  id: string;
  userId: string;
  profileImageUrl?: string;
  gender?: string;
  dateOfBirth?: string;
  createdAt: string;
  updatedAt?: string;
  addresses: Address[];
}

interface FullProfile {
  customer: CustomerDetail;
  authentication: { auth: AuthInfo; message: string };
}

interface Order {
  orderId: string;
  orderNumber: string;
  orderType: string;
  orderStatus: string;
  totalAmount: number;
  paymentMethod: string;
  orderDate: string;
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

function shortId(id: string) {
  if (!id) return "—";
  return id.length > 14 ? "…" + id.slice(-12) : id;
}

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  PROCESSING: "bg-purple-100 text-purple-700",
  SHIPPED: "bg-indigo-100 text-indigo-700",
  DELIVERED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
};

// ── Address Modal ──────────────────────────────────────────────────────────────

function AddressModal({
  customerId,
  address,
  onClose,
  onSaved,
}: {
  customerId: string;
  address: Address | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = address !== null;
  const [form, setForm] = useState<AddressPayload>({
    label: address?.label ?? "",
    street: address?.street ?? "",
    city: address?.city ?? "",
    state: address?.state ?? "",
    postalCode: address?.postalCode ?? "",
    country: address?.country ?? "India",
    isDefault: address?.isDefault ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update(k: keyof AddressPayload, v: string | boolean) {
    setForm((f) => ({ ...f, [k]: v }));
    setError("");
  }

  async function handleSave() {
    if (!form.street.trim() || !form.city.trim() || !form.state.trim()) {
      setError("Street, city and state are required");
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await updateCustomerAddress(customerId, address!.id, form);
      } else {
        await addCustomerAddress(customerId, form);
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save address");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-800">
            {isEdit ? "Edit address" : "Add address"}
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

        <div className="px-6 py-5 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Label
              </label>
              <input
                value={form.label}
                onChange={(e) => update("label", e.target.value)}
                placeholder="Home / Office / Other"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Country
              </label>
              <input
                value={form.country}
                onChange={(e) => update("country", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Street *
            </label>
            <input
              value={form.street}
              onChange={(e) => update("street", e.target.value)}
              placeholder="Street address"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                City *
              </label>
              <input
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                State *
              </label>
              <input
                value={form.state}
                onChange={(e) => update("state", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Postal code
              </label>
              <input
                value={form.postalCode}
                onChange={(e) => update("postalCode", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none mt-1">
            <input
              type="checkbox"
              checked={form.isDefault ?? false}
              onChange={(e) => update("isDefault", e.target.checked)}
              className="w-4 h-4 rounded accent-black"
            />
            <span className="text-sm text-gray-600">
              Set as default address
            </span>
          </label>

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
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Profile Edit Modal ─────────────────────────────────────────────────────────

function ProfileModal({
  customer,
  onClose,
  onSaved,
}: {
  customer: CustomerDetail;
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
          <p className="text-sm font-semibold text-gray-800">Edit profile</p>
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
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Gender
            </label>
            <div className="relative">
              <select
                value={gender}
                onChange={(e) => {
                  setGender(e.target.value);
                  setError("");
                }}
                className="w-full pl-3 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl appearance-none focus:outline-none focus:border-gray-400"
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
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Date of birth
            </label>
            <input
              type="date"
              value={dob}
              onChange={(e) => {
                setDob(e.target.value);
                setError("");
              }}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Profile image URL
            </label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                setError("");
              }}
              placeholder="https://..."
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400"
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
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Address Confirm ─────────────────────────────────────────────────────

function DeleteAddressConfirm({
  onClose,
  onConfirm,
  deleting,
}: {
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
          <p className="text-center text-sm font-semibold text-gray-800">
            Delete this address?
          </p>
          <p className="text-center text-xs text-gray-500">
            This action cannot be undone.
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

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.customerId as string;

  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersPages, setOrdersPages] = useState(0);
  const [ordersPage, setOrdersPage] = useState(0);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersStatusFilter, setOrdersStatusFilter] = useState("");

  // Modals
  const [profileModal, setProfileModal] = useState(false);
  const [addressModal, setAddressModal] = useState<{
    open: boolean;
    address: Address | null;
  }>({ open: false, address: null });
  const [deleteAddress, setDeleteAddress] = useState<Address | null>(null);
  const [deletingAddress, setDeletingAddress] = useState(false);

  const ORDER_SIZE = 10;

  function loadCustomer() {
    setLoading(true);
    // First get the customer record to find their user_id
    fetchCustomerById(customerId)
      .then((data: CustomerDetail) => {
        const userId = data.userId;
        // Then fetch full profile (auth info + customer) using user_id
        return fetchCustomerProfile(userId).then((full: FullProfile) => {
          // Merge addresses from the customer record (getCustomerById has them)
          full.customer.addresses = data.addresses ?? [];
          setProfile(full);
        });
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }

  function loadOrders(userId: string) {
    setOrdersLoading(true);
    fetchOrdersByUser({
      userId,
      page: ordersPage,
      size: ORDER_SIZE,
      ...(ordersStatusFilter ? { status: ordersStatusFilter } : {}),
    })
      .then(
        (data: {
          content: Order[];
          totalElements: number;
          totalPages: number;
        }) => {
          setOrders(data.content ?? []);
          setOrdersTotal(data.totalElements ?? 0);
          setOrdersPages(data.totalPages ?? 0);
        },
      )
      .catch(() => setOrders([]))
      .finally(() => setOrdersLoading(false));
  }

  useEffect(() => {
    loadCustomer();
  }, [customerId]);

  useEffect(() => {
    if (profile?.authentication?.auth?.userId)
      loadOrders(profile.authentication.auth.userId);
  }, [profile?.authentication?.auth?.userId, ordersPage, ordersStatusFilter]);

  async function handleDeleteAddress() {
    if (!deleteAddress) return;
    setDeletingAddress(true);
    try {
      await deleteCustomerAddress(customerId, deleteAddress.id);
      setDeleteAddress(null);
      loadCustomer();
    } catch {
      // keep dialog
    } finally {
      setDeletingAddress(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 gap-3 text-gray-400">
        <IconLoader />
        <span className="text-sm">Loading customer...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <IconEmptyBox />
        <p className="text-lg font-medium text-gray-500">Customer not found</p>
        <button
          onClick={() => router.back()}
          className="text-sm text-blue-600 hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  const customer = profile.customer;
  const auth = profile.authentication?.auth;
  const ordStart = ordersTotal === 0 ? 0 : ordersPage * ORDER_SIZE + 1;
  const ordEnd = Math.min(ordersPage * ORDER_SIZE + orders.length, ordersTotal);

  return (
    <div className="flex flex-col gap-6">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors w-fit"
      >
        <IconChevronLeft />
        Back to customers
      </button>

      {/* ── Profile card ─────────────────────────────────────────────────────── */}
      <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl p-6 flex items-start gap-6">
        {customer.profileImageUrl ? (
          <img
            src={customer.profileImageUrl}
            alt=""
            className="w-20 h-20 rounded-2xl object-cover shrink-0"
          />
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shrink-0">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
              />
            </svg>
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Name + badges */}
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <p className="text-lg font-semibold text-gray-800">
              {auth?.fullName || "—"}
            </p>
            {customer.gender && (
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  customer.gender.toLowerCase() === "male"
                    ? "bg-blue-50 text-blue-700"
                    : customer.gender.toLowerCase() === "female"
                      ? "bg-pink-50 text-pink-700"
                      : "bg-gray-100 text-gray-600"
                }`}
              >
                {customer.gender.charAt(0).toUpperCase() +
                  customer.gender.slice(1).toLowerCase()}
              </span>
            )}
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
              {auth?.role || "CUSTOMER"}
            </span>
          </div>

          {/* Contact info */}
          <div className="flex flex-wrap gap-4 mb-4 mt-2">
            <div className="flex items-center gap-1.5">
              <svg
                className="w-3.5 h-3.5 text-gray-400 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <span className="text-xs text-gray-600">
                {auth?.email || "—"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg
                className="w-3.5 h-3.5 text-gray-400 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              <span className="text-xs text-gray-600">
                {auth?.phoneNumber || "—"}
              </span>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {(
              [
                [
                  "Date of birth",
                  customer.dateOfBirth ? formatDate(customer.dateOfBirth) : "—",
                ],
                ["Member since", formatDate(customer.createdAt)],
                [
                  "Last updated",
                  customer.updatedAt ? formatDate(customer.updatedAt) : "—",
                ],
                ["Addresses", String(customer.addresses?.length ?? 0)],
              ] as [string, string][]
            ).map(([k, v]) => (
              <div key={k}>
                <p className="text-[10px] font-medium text-[#616a7c] uppercase tracking-wide">
                  {k}
                </p>
                <p className="text-sm text-gray-800 mt-0.5">{v}</p>
              </div>
            ))}
          </div>

          {/* IDs as tags */}
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 border border-gray-200">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                Customer ID
              </span>
              <span className="text-[11px] font-mono text-gray-600">
                {customer.id}
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 border border-gray-200">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                User ID
              </span>
              <span className="text-[11px] font-mono text-gray-600">
                {auth?.userId}
              </span>
            </span>
          </div>
        </div>

        <button
          onClick={() => setProfileModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shrink-0"
        >
          <IconEdit />
          Edit
        </button>
      </div>

      {/* ── Addresses ────────────────────────────────────────────────────────── */}
      <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-800">Addresses</p>
          <button
            onClick={() => setAddressModal({ open: true, address: null })}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-black rounded-xl hover:bg-gray-800 transition-colors"
          >
            <IconPlus />
            Add address
          </button>
        </div>

        {customer.addresses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <IconEmptyBox />
            <p className="text-sm text-gray-400">No addresses yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {customer.addresses.map((addr) => (
              <div key={addr.id} className="px-5 py-4 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-800">
                      {addr.label || "Address"}
                    </p>
                    {addr.isDefault && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600">
                    {[
                      addr.street,
                      addr.city,
                      addr.state,
                      addr.postalCode,
                      addr.country,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() =>
                      setAddressModal({ open: true, address: addr })
                    }
                    className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                    title="Edit"
                  >
                    <IconEdit />
                  </button>
                  <button
                    onClick={() => setDeleteAddress(addr)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <IconTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Order history ────────────────────────────────────────────────────── */}
      <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-gray-800">Order history</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 shrink-0">Status</span>
            <div className="relative">
              <select
                value={ordersStatusFilter}
                onChange={(e) => {
                  setOrdersStatusFilter(e.target.value);
                  setOrdersPage(0);
                }}
                className="pl-2 pr-7 py-1 text-sm bg-white border border-gray-200 rounded-lg text-gray-700 appearance-none cursor-pointer focus:outline-none"
              >
                <option value="">All</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PROCESSING">Processing</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400">
                <IconChevronDown />
              </span>
            </div>
          </div>
        </div>

        {ordersLoading ? (
          <div className="flex items-center justify-center py-12 gap-3 text-gray-400">
            <IconLoader />
            <span className="text-sm">Loading orders...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <IconEmptyBox />
            <p className="text-sm text-gray-400">No orders found</p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-gray-400 font-medium border-b border-gray-100">
                  <th className="text-left px-4 py-3">Order #</th>
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Amount</th>
                  <th className="text-left px-4 py-3">Payment</th>
                  <th className="text-left px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr
                    key={o.orderId}
                    className="border-t border-gray-100 hover:bg-white/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-xs font-mono text-gray-700">
                      {o.orderNumber}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {o.orderType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[o.orderStatus] ?? "bg-gray-100 text-gray-600"}`}
                      >
                        {o.orderStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700">
                      ₹{o.totalAmount?.toLocaleString("en-IN") ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {o.paymentMethod}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {formatDate(o.orderDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
              <p className="text-xs text-[#616a7c]">
                Showing {ordStart}–{ordEnd} of {ordersTotal} order
                {ordersTotal !== 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setOrdersPage((p) => Math.max(0, p - 1))}
                  disabled={ordersPage === 0}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors ${ordersPage === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <IconChevronLeft />
                  Previous
                </button>
                {ordersPages <= 7 ? (
                  Array.from({ length: ordersPages }, (_, i) => i + 1).map(
                    (n) => (
                      <button
                        key={n}
                        onClick={() => setOrdersPage(n - 1)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${n === ordersPage + 1 ? "bg-black text-white" : "text-gray-600 hover:bg-gray-100"}`}
                      >
                        {n}
                      </button>
                    ),
                  )
                ) : (
                  <span className="px-3 py-1.5 text-xs font-medium text-gray-600">
                    {ordersPage + 1} / {ordersPages}
                  </span>
                )}
                <button
                  onClick={() =>
                    setOrdersPage((p) => Math.min(ordersPages - 1, p + 1))
                  }
                  disabled={ordersPage >= ordersPages - 1}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors ${ordersPage >= ordersPages - 1 ? "opacity-50 cursor-not-allowed" : ""}`}
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
      {profileModal && (
        <ProfileModal
          customer={customer}
          onClose={() => setProfileModal(false)}
          onSaved={loadCustomer}
        />
      )}
      {addressModal.open && (
        <AddressModal
          customerId={customerId}
          address={addressModal.address}
          onClose={() => setAddressModal({ open: false, address: null })}
          onSaved={loadCustomer}
        />
      )}
      {deleteAddress && (
        <DeleteAddressConfirm
          onClose={() => setDeleteAddress(null)}
          onConfirm={handleDeleteAddress}
          deleting={deletingAddress}
        />
      )}
    </div>
  );
}
