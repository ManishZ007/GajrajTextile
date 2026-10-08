'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Plus,
  Check,
  ChevronRight,
  ShieldCheck,
  Phone,
  Mail,
  Home,
  Briefcase,
  Tag,
  ArrowLeft,
  ChevronDown,
} from 'lucide-react';
import { clientFetch } from '@/lib/clientFetch';
import {
  CustomerProfile,
  Address,
  AddressFormData,
  isProfileComplete,
} from '@/types/customer';
import { CartResponse } from '@/types/cart';
import { toCapitalCase } from '@/lib/textUtils';
import { useAddressStore } from '@/store/addressStore';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);

const LABEL_ICONS: Record<string, React.ElementType> = {
  Home,
  Office: Briefcase,
  Other: Tag,
};

const LABEL_OPTIONS = ['Home', 'Office', 'Other'];

function getLabelIcon(label: string): React.ElementType {
  return LABEL_ICONS[label] ?? MapPin;
}

// ─── Checkout Steps ───────────────────────────────────────────────────────────

const STEPS = ['BAG', 'ADDRESS', 'PAYMENT'] as const;

function CheckoutSteps({ currentStep = 1 }: { currentStep?: number }) {
  return (
    <div className="w-full border-b border-black/8 bg-white">
      <div className="px-6 md:px-12 h-10 flex items-center justify-between relative">
        <div className="flex items-center gap-5 mx-auto">
          {STEPS.map((step, i) => {
            const isActive = i === currentStep;
            const isDone = i < currentStep;
            return (
              <div key={step} className="flex items-center gap-5">
                <div className="flex flex-col items-center">
                  <span
                    className="text-[0.6rem] tracking-[2px] uppercase transition-colors duration-200"
                    style={{
                      color: isActive
                        ? '#1B1B1B'
                        : isDone
                          ? 'rgba(27,27,27,0.45)'
                          : 'rgba(27,27,27,0.2)',
                    }}
                  >
                    {step}
                  </span>
                  <div
                    className="h-px w-full mt-0.5 transition-all duration-300"
                    style={{ background: isActive ? '#1B1B1B' : 'transparent' }}
                  />
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex gap-0.5 pb-1">
                    {Array.from({ length: 5 }).map((_, d) => (
                      <span
                        key={d}
                        className="w-1 h-px"
                        style={{
                          background: isDone
                            ? 'rgba(27,27,27,0.25)'
                            : 'rgba(27,27,27,0.1)',
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-1.5 absolute right-6 md:right-12">
          <ShieldCheck
            strokeWidth={1.5}
            className="w-3 h-3 text-[#1B1B1B]/25"
          />
          <span className="hidden sm:block text-[0.6rem] tracking-[1.5px] uppercase text-[#1B1B1B]/25">
            Secure
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CheckoutSkeleton() {
  return (
    <div className="max-w-5xl mx-auto w-full px-6 md:px-10 pt-10 pb-16 flex flex-col lg:flex-row gap-10 lg:gap-14">
      <div className="flex-1 flex flex-col gap-7">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex flex-col gap-3 border-b border-black/8 pb-7"
          >
            <div
              className="h-2.5 w-20 rounded-sm"
              style={{
                background: 'rgba(27,27,27,0.05)',
                animation: 'skeleton-shimmer 1.6s infinite',
              }}
            />
            <div
              className="h-3.5 w-48 rounded-sm"
              style={{
                background: 'rgba(27,27,27,0.05)',
                animation: 'skeleton-shimmer 1.6s 0.1s infinite',
              }}
            />
            <div
              className="h-2.5 w-36 rounded-sm"
              style={{
                background: 'rgba(27,27,27,0.05)',
                animation: 'skeleton-shimmer 1.6s 0.2s infinite',
              }}
            />
          </div>
        ))}
      </div>
      <div className="lg:w-72 xl:w-80 shrink-0">
        <div className="border border-black/8 px-8 py-10 flex flex-col gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-3 w-full rounded-sm"
              style={{
                background: 'rgba(27,27,27,0.05)',
                animation: `skeleton-shimmer 1.6s ${i * 0.1}s infinite`,
              }}
            />
          ))}
          <div
            className="h-12 w-full mt-2 rounded-sm"
            style={{
              background: 'rgba(27,27,27,0.05)',
              animation: 'skeleton-shimmer 1.6s infinite',
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Address Card ─────────────────────────────────────────────────────────────

function AddressCard({
  address,
  selected,
  onSelect,
}: {
  address: Address;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = getLabelIcon(address.label);
  return (
    <button
      onClick={onSelect}
      className="w-full text-left p-4 border transition-all duration-200 cursor-pointer"
      style={{
        borderColor: selected ? '#1B1B1B' : 'rgba(27,27,27,0.1)',
        borderWidth: selected ? '1.5px' : '1px',
      }}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className="w-8 h-8 flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: selected ? '#1B1B1B' : 'rgba(27,27,27,0.04)' }}
        >
          <Icon
            strokeWidth={1.5}
            className="w-3.5 h-3.5"
            style={{ color: selected ? 'white' : 'rgba(27,27,27,0.35)' }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[0.7rem] tracking-[1.5px] uppercase text-[#1B1B1B] font-light">
              {address.label}
            </span>
            {address.isDefault && (
              <span className="text-[0.6rem] tracking-[1px] uppercase text-[#1B1B1B]/70 border border-black/55 px-1.5 py-0.5">
                Default
              </span>
            )}
          </div>
          <p className="text-[13px] font-light text-[#1B1B1B] leading-snug mb-0.5">
            {address.street}
          </p>
          <p className="text-[12px] font-light text-[#1B1B1B]/75">
            {toCapitalCase(address.city)}, {toCapitalCase(address.state)} —{' '}
            {address.postalCode}
          </p>
          <p className="text-[12px] font-light text-[#1B1B1B]/75">
            {toCapitalCase(address.country)}
          </p>
        </div>

        {/* Radio indicator */}
        <div
          className="w-4 h-4 border flex items-center justify-center shrink-0 mt-1 transition-all duration-200"
          style={{
            borderColor: selected ? '#1B1B1B' : 'rgba(27,27,27,0.15)',
            background: selected ? '#1B1B1B' : 'transparent',
          }}
        >
          {selected && (
            <Check strokeWidth={2.5} className="w-2.5 h-2.5 text-white" />
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Add Address Form ─────────────────────────────────────────────────────────

function AddAddressForm({
  onSave,
  onCancel,
  saving,
}: {
  onSave: (data: AddressFormData) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<AddressFormData>({
    label: 'Home',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    isDefault: false,
  });

  const set = (key: keyof AddressFormData, val: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(form);
  };

  const inputCls =
    'w-full border-b border-black/15 bg-transparent text-[13.5px] font-light text-[#1B1B1B] pb-3 pt-1 outline-none focus:border-[#1B1B1B] placeholder:text-[#1B1B1B]/25 transition-colors duration-200';
  const labelCls =
    'block text-[0.7rem] tracking-[1.5px] uppercase text-[#1B1B1B]/75 mb-2';

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="border border-black/8 p-6"
    >
      <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95 mb-7">
        New Address
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Label select */}
        <div>
          <label className={labelCls}>Label</label>
          <div className="relative">
            <select
              value={form.label}
              onChange={(e) => set('label', e.target.value)}
              className={inputCls + ' appearance-none pr-6 cursor-pointer'}
            >
              {LABEL_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <ChevronDown
              strokeWidth={1.5}
              className="w-3.5 h-3.5 absolute right-0 top-1 pointer-events-none text-[#1B1B1B]/90"
            />
          </div>
        </div>

        {/* Street */}
        <div>
          <label className={labelCls}>Street / Area</label>
          <input
            required
            type="text"
            placeholder="House no., street, locality"
            value={form.street}
            onChange={(e) => set('street', e.target.value)}
            className={inputCls}
          />
        </div>

        {/* City + State */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className={labelCls}>City</label>
            <input
              required
              type="text"
              placeholder="City"
              value={form.city}
              onChange={(e) => set('city', e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>State</label>
            <input
              required
              type="text"
              placeholder="State"
              value={form.state}
              onChange={(e) => set('state', e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        {/* Postal code + Country */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className={labelCls}>Postal Code</label>
            <input
              required
              type="text"
              placeholder="400001"
              value={form.postalCode}
              onChange={(e) => set('postalCode', e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Country</label>
            <input
              required
              type="text"
              placeholder="India"
              value={form.country}
              onChange={(e) => set('country', e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        {/* Set as default */}
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <div
            onClick={() => set('isDefault', !form.isDefault)}
            className="w-4 h-4 border flex items-center justify-center transition-all duration-150 shrink-0"
            style={{
              borderColor: form.isDefault ? '#1B1B1B' : 'rgba(27,27,27,0.2)',
              background: form.isDefault ? '#1B1B1B' : 'transparent',
            }}
          >
            {form.isDefault && (
              <Check strokeWidth={2.5} className="w-2.5 h-2.5 text-white" />
            )}
          </div>
          <span className="text-[13px] font-light text-[#1B1B1B]/75">
            Set as default address
          </span>
        </label>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3.5 text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/70 border border-black/55 hover:text-[#1B1B1B] hover:border-black/25 transition-colors duration-200 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-3.5 text-[0.725rem] tracking-[1.5px] uppercase text-white bg-black rounded-full hover:opacity-80 transition-opacity duration-200 cursor-pointer disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Save Address'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}

// ─── Checkout Page ────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router = useRouter();
  const { status } = useSession();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const addresses = useAddressStore((s) => s.addresses);
  const setAddresses = useAddressStore((s) => s.setAddresses);
  useEffect(() => {
    if (status === 'unauthenticated') { router.replace('/login'); return; }
    if (status !== 'authenticated') return;
    Promise.all([
      clientFetch('/api/customer/profile').then((r) => r.json()),
      clientFetch('/api/cart')
        .then((r) => r.json())
        .catch(() => null),
    ])
      .then(([profileData, cartData]) => {
        if (!isProfileComplete(profileData)) {
          router.replace('/profile?redirect=/checkout&reason=incomplete');
          return;
        }
        setProfile(profileData);
        const addrs: Address[] = Array.isArray(profileData?.customer?.addresses)
          ? profileData.customer.addresses
          : [];
        setAddresses(addrs);
        const def = addrs.find((a) => a.isDefault) ?? addrs[0];
        if (def) setSelectedId(def.id);
        setCart(cartData);
      })
      .finally(() => setLoading(false));
  }, [status, router]);

  const handleSaveAddress = async (formData: AddressFormData) => {
    setSaving(true);
    try {
      await clientFetch('/api/customer/address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const r = await clientFetch('/api/customer/address');
      const raw = await r.json();
      const fresh: Address[] = Array.isArray(raw) ? raw : [];
      setAddresses(fresh);
      if (fresh.length > 0) {
        const newest = fresh[fresh.length - 1];
        if (!selectedId) setSelectedId(newest.id);
      }
      setShowAddForm(false);
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const authInfo = profile?.authentication?.auth;
  const safeAddresses = Array.isArray(addresses) ? addresses : [];
  const safeItems = Array.isArray(cart?.items) ? cart!.items : [];
  const totalQty = safeItems.reduce((s, i) => s + i.quantity, 0);
  const selectedAddress = safeAddresses.find((a) => a.id === selectedId);

  console.log(safeAddresses, safeItems, authInfo);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <style>{`
        @keyframes skeleton-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <CheckoutSteps currentStep={1} />

      {loading ? (
        <CheckoutSkeleton />
      ) : (
        <div className="max-w-5xl mx-auto w-full px-6 md:px-10 pt-10 pb-16 flex flex-col lg:flex-row gap-10 lg:gap-14">
          {/* ── LEFT ─────────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 flex flex-col gap-8">
            {/* Back to bag */}
            <button
              onClick={() => router.push('/cart')}
              className="flex items-center gap-1.5 text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95 transition-colors duration-200 cursor-pointer self-start"
            >
              <ArrowLeft strokeWidth={1.5} className="w-3 h-3" />
              Back to Bag
            </button>

            {/* Customer Info */}
            {authInfo && (
              <div className="border-b border-black/8 pb-8">
                <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/75 mb-5">
                  Customer
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#1B1B1B]/6 flex items-center justify-center shrink-0 text-[14px] font-light text-[#1B1B1B] select-none">
                    {authInfo.fullName?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <span className="text-[14px] font-light text-[#1B1B1B]">
                      {toCapitalCase(authInfo.fullName)}
                    </span>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-5">
                      <span className="flex items-center gap-1.5 text-[12px] font-light text-[#1B1B1B]/75">
                        <Mail strokeWidth={1.5} className="w-3 h-3 shrink-0" />
                        {authInfo.email}
                      </span>
                      <span className="flex items-center gap-1.5 text-[12px] font-light text-[#1B1B1B]/75">
                        <Phone strokeWidth={1.5} className="w-3 h-3 shrink-0" />
                        {authInfo.phoneNumber}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Delivery Address */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95">
                  Delivery Address
                </p>
                <span className="text-[12px] font-light text-[#1B1B1B]/70">
                  {safeAddresses.length} saved
                </span>
              </div>

              {safeAddresses.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center border border-black/8">
                  <MapPin
                    strokeWidth={1}
                    className="w-7 h-7 text-[#1B1B1B]/15"
                  />
                  <p className="text-[13px] font-light text-[#1B1B1B]/35">
                    No saved addresses yet
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <AnimatePresence initial={false}>
                    {safeAddresses.map((addr) => (
                      <AddressCard
                        key={addr.id}
                        address={addr}
                        selected={addr.id === selectedId}
                        onSelect={() => setSelectedId(addr.id)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Add New Address */}
            <AnimatePresence mode="wait">
              {showAddForm ? (
                <AddAddressForm
                  key="form"
                  onSave={handleSaveAddress}
                  onCancel={() => setShowAddForm(false)}
                  saving={saving}
                />
              ) : (
                <motion.button
                  key="add-btn"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center justify-center gap-2 w-full py-4 border border-dashed border-black/12 text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/35 hover:text-[#1B1B1B]/60 hover:border-black/25 transition-colors duration-200 cursor-pointer"
                >
                  <Plus strokeWidth={1.5} className="w-3.5 h-3.5" />
                  Add New Address
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* ── RIGHT: Summary ────────────────────────────────────────────── */}
          <div className="lg:w-72 xl:w-80 shrink-0">
            <div className=" px-8 py-10 lg:sticky lg:top-8 flex flex-col gap-7">
              <p className="text-[0.65rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95">
                Order Summary
              </p>

              {/* Delivering to */}
              {selectedAddress && (
                <div className="border-b border-black/8 pb-6">
                  <p className="text-[0.65rem] tracking-[1.5px] uppercase text-[#1B1B1B]/75 mb-2">
                    Delivering to
                  </p>
                  <p className="text-[13px] font-light text-[#1B1B1B]">
                    {selectedAddress.label} — {selectedAddress.street}
                  </p>
                  <p className="text-[12px] font-light text-[#1B1B1B]/65 mt-0.5">
                    {toCapitalCase(selectedAddress.city)},{' '}
                    {selectedAddress.postalCode}
                  </p>
                </div>
              )}

              {/* Price rows */}
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-baseline">
                  <p className="text-[13px] font-light text-[#1B1B1B]/75">
                    Subtotal
                    <span className="text-[#1B1B1B]/75 ml-1 text-[11px]">
                      ({totalQty})
                    </span>
                  </p>
                  <p className="text-[13px] font-light text-[#1B1B1B]/75">
                    {cart ? formatINR(cart.subtotal) : '—'}
                  </p>
                </div>
                <div className="flex justify-between items-baseline">
                  <p className="text-[13px] font-light text-[#1B1B1B]/70">
                    Delivery
                  </p>
                  <p className="text-[11px] tracking-[1px] uppercase text-[#1B1B1B]/70">
                    Free
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-black/8" />

              {/* Total */}
              <div className="flex justify-between items-baseline">
                <p className="text-[0.65rem] tracking-[1.5px] uppercase text-[#1B1B1B]/75">
                  Total
                </p>
                <p
                  className="font-light text-[#1B1B1B]"
                  style={{ fontSize: 'clamp(1.1rem, 2vw, 1.4rem)' }}
                >
                  {cart ? formatINR(cart.estimatedTotal) : '—'}
                </p>
              </div>

              {/* Proceed */}
              <button
                disabled={!selectedId}
                onClick={() => router.push(`/payment?addressId=${selectedId}`)}
                className="w-full bg-black text-white text-[0.725rem] tracking-[1.5px] uppercase py-4 rounded-full hover:opacity-80 transition-opacity duration-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-35 disabled:cursor-not-allowed"
              >
                Proceed to Payment
                <ChevronRight strokeWidth={1.5} className="w-3.5 h-3.5" />
              </button>

              {!selectedId && (
                <p className="text-center text-[11px] font-light text-[#1B1B1B]/35 -mt-3">
                  Select a delivery address to continue
                </p>
              )}

              {/* Secure */}
              <div className="flex items-center justify-center gap-1.5">
                <ShieldCheck
                  strokeWidth={1.5}
                  className="w-4 h-4 text-[#1B1B1B]/75"
                />
                <span className="text-[0.6rem] tracking-[1.5px] uppercase text-[#1B1B1B]/75">
                  Safe &amp; Secure Payments
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
