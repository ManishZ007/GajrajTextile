'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
    <div
      className="w-full border-b"
      style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        fontFamily: 'Switzer', fontWeight: 500,
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-10 h-11 flex items-center relative">
        <div className="flex items-center mx-auto">
          {STEPS.map((step, i) => {
            const isActive = i === currentStep;
            const isDone = i < currentStep;
            return (
              <div key={step} className="flex items-center">
                <div className="flex flex-col items-center">
                  <span
                    className="text-[10px] sm:text-[11px] font-semibold tracking-[2px] transition-colors duration-300"
                    style={{
                      color: isActive
                        ? 'var(--color-text)'
                        : isDone
                          ? 'var(--color-text-muted)'
                          : 'var(--color-text-subtle)',
                    }}
                  >
                    {step}
                  </span>
                  <motion.div
                    animate={{
                      scaleX: isActive ? 1 : 0,
                      opacity: isActive ? 1 : 0,
                    }}
                    transition={{ duration: 0.3 }}
                    className="h-0.5 w-full mt-0.5 origin-left rounded-full"
                    style={{ background: 'var(--color-text)' }}
                  />
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex items-center mx-3 sm:mx-5 pb-1">
                    {Array.from({ length: 6 }).map((_, d) => (
                      <span
                        key={d}
                        className="w-1.5 h-px mx-px rounded-full"
                        style={{
                          background: isDone
                            ? 'var(--color-text-muted)'
                            : 'var(--color-border-strong)',
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-1.5 absolute right-4 sm:right-10">
          <ShieldCheck
            strokeWidth={1.5}
            className="w-3.5 h-3.5 text-emerald-500"
          />
          <span
            className="hidden sm:block text-[10px] font-semibold tracking-[1.5px] uppercase"
            style={{ color: 'var(--color-text-subtle)' }}
          >
            100% Secure
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const shimmer = {
  background: 'linear-gradient(90deg,#EDE8E3 25%,#F5F1EC 50%,#EDE8E3 75%)',
  backgroundSize: '200% 100%',
  animation: 'skeleton-shimmer 1.6s infinite',
} as const;

function CheckoutSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto px-4 sm:px-8 pt-6 pb-16">
      <div className="flex-1 flex flex-col gap-4">
        <div
          className="rounded-2xl p-5 border"
          style={{
            background: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="h-3 w-32 rounded mb-4" style={shimmer} />
          <div className="flex flex-col gap-2.5">
            <div className="h-4 w-48 rounded" style={shimmer} />
            <div className="h-3 w-36 rounded" style={shimmer} />
            <div className="h-3 w-40 rounded" style={shimmer} />
          </div>
        </div>
        {[1, 2].map((i) => (
          <div
            key={i}
            className="rounded-2xl p-4 border"
            style={{
              background: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div className="h-4 w-20 rounded mb-3" style={shimmer} />
            <div className="h-3 w-full rounded mb-2" style={shimmer} />
            <div className="h-3 w-2/3 rounded" style={shimmer} />
          </div>
        ))}
      </div>
      <div className="lg:w-80">
        <div
          className="rounded-2xl p-5 border"
          style={{
            background: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="h-3 w-24 rounded mb-4" style={shimmer} />
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-3 w-full rounded" style={shimmer} />
            ))}
          </div>
          <div className="h-12 w-full rounded-2xl mt-5" style={shimmer} />
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
    <motion.button
      layout
      onClick={onSelect}
      whileTap={{ scale: 0.99 }}
      className="w-full text-left rounded-2xl p-4 border transition-all duration-200 cursor-pointer relative"
      style={{
        background: selected ? 'rgba(10,10,10,0.03)' : 'var(--color-surface)',
        borderColor: selected ? 'var(--color-text)' : 'var(--color-border)',
        borderWidth: selected ? '1.5px' : '1px',
      }}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{
            background: selected
              ? 'var(--color-text)'
              : 'var(--color-surface-muted)',
          }}
        >
          <Icon
            strokeWidth={1.5}
            className="w-4 h-4"
            style={{
              color: selected
                ? 'var(--color-accent-text)'
                : 'var(--color-text-muted)',
            }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span
              className="text-[12px] font-semibold uppercase tracking-wider"
              style={{ color: 'var(--color-text)' }}
            >
              {address.label}
            </span>
            {address.isDefault && (
              <span
                className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{
                  background: 'rgba(0,0,0,0.06)',
                  color: 'var(--color-text-muted)',
                }}
              >
                Default
              </span>
            )}
          </div>
          <p
            className="text-[13px] mt-1 leading-snug"
            style={{ color: 'var(--color-text)' }}
          >
            {address.street}
          </p>
          <p
            className="text-[12px] mt-0.5"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {toCapitalCase(address.city)}, {toCapitalCase(address.state)} —{' '}
            <span style={{ fontFamily: 'Switzer', fontWeight: 500 }}>
              {address.postalCode}
            </span>
          </p>
          <p
            className="text-[12px]"
            style={{ color: 'var(--color-text-subtle)' }}
          >
            {toCapitalCase(address.country)}
          </p>
        </div>

        {/* Selected indicator */}
        <div
          className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 transition-all duration-200"
          style={{
            borderColor: selected
              ? 'var(--color-text)'
              : 'var(--color-border-strong)',
            background: selected ? 'var(--color-text)' : 'transparent',
          }}
        >
          {selected && (
            <Check
              strokeWidth={2.5}
              className="w-2.5 h-2.5"
              style={{ color: 'var(--color-accent-text)' }}
            />
          )}
        </div>
      </div>
    </motion.button>
  );
}

// ─── Add Address Form ─────────────────────────────────────────────────────────

const INPUT_STYLE = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border-strong)',
  color: 'var(--color-text)',
  borderRadius: '12px',
  padding: '10px 14px',
  fontSize: '13px',
  width: '100%',
  outline: 'none',
} as const;

const LABEL_STYLE = {
  fontSize: '10px',
  fontWeight: 600,
  letterSpacing: '1.5px',
  textTransform: 'uppercase' as const,
  color: 'var(--color-text-subtle)',
  marginBottom: '6px',
  display: 'block',
};

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

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl p-5 border"
      style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      <p
        className="text-[11px] font-semibold uppercase tracking-widest mb-4"
        style={{ color: 'var(--color-text-subtle)' }}
      >
        New Address
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Label select */}
        <div>
          <label style={LABEL_STYLE}>Label</label>
          <div className="relative">
            <select
              value={form.label}
              onChange={(e) => set('label', e.target.value)}
              style={{
                ...INPUT_STYLE,
                appearance: 'none',
                paddingRight: '36px',
                cursor: 'pointer',
              }}
            >
              {LABEL_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <ChevronDown
              strokeWidth={1.8}
              className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--color-text-subtle)' }}
            />
          </div>
        </div>

        {/* Street */}
        <div>
          <label style={LABEL_STYLE}>Street / Area</label>
          <input
            required
            type="text"
            placeholder="House no., street, locality"
            value={form.street}
            onChange={(e) => set('street', e.target.value)}
            style={INPUT_STYLE}
          />
        </div>

        {/* City + State */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label style={LABEL_STYLE}>City</label>
            <input
              required
              type="text"
              placeholder="City"
              value={form.city}
              onChange={(e) => set('city', e.target.value)}
              style={INPUT_STYLE}
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>State</label>
            <input
              required
              type="text"
              placeholder="State"
              value={form.state}
              onChange={(e) => set('state', e.target.value)}
              style={INPUT_STYLE}
            />
          </div>
        </div>

        {/* Postal code + Country */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label style={LABEL_STYLE}>Postal Code</label>
            <input
              required
              type="text"
              placeholder="400001"
              value={form.postalCode}
              onChange={(e) => set('postalCode', e.target.value)}
              style={{ ...INPUT_STYLE, fontFamily: 'Switzer', fontWeight: 500 }}
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>Country</label>
            <input
              required
              type="text"
              placeholder="India"
              value={form.country}
              onChange={(e) => set('country', e.target.value)}
              style={INPUT_STYLE}
            />
          </div>
        </div>

        {/* Set as default */}
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <div
            onClick={() => set('isDefault', !form.isDefault)}
            className="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-150 shrink-0"
            style={{
              borderColor: form.isDefault
                ? 'var(--color-text)'
                : 'var(--color-border-strong)',
              background: form.isDefault ? 'var(--color-text)' : 'transparent',
            }}
          >
            {form.isDefault && (
              <Check
                strokeWidth={2.5}
                className="w-2.5 h-2.5"
                style={{ color: 'var(--color-accent-text)' }}
              />
            )}
          </div>
          <span
            className="text-[12.5px]"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Set as default address
          </span>
        </label>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl text-[12.5px] font-medium border cursor-pointer transition duration-150 hover:opacity-70"
            style={{
              borderColor: 'var(--color-border-strong)',
              color: 'var(--color-text-muted)',
            }}
          >
            Cancel
          </button>
          <motion.button
            type="submit"
            whileTap={{ scale: 0.97 }}
            disabled={saving}
            className="flex-1 py-3 rounded-2xl text-[12.5px] font-medium cursor-pointer transition duration-150 hover:opacity-80 disabled:opacity-50"
            style={{
              background: 'var(--color-accent)',
              color: 'var(--color-accent-text)',
            }}
          >
            {saving ? 'Saving…' : 'Save Address'}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
}

// ─── Checkout Page ────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const addresses = useAddressStore((s) => s.addresses);
  const setAddresses = useAddressStore((s) => s.setAddresses);

  useEffect(() => {
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
  }, []);

  const handleSaveAddress = async (formData: AddressFormData) => {
    setSaving(true);
    try {
      await clientFetch('/api/customer/address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      // Re-fetch the full list so we get real server-assigned ids
      const r = await clientFetch('/api/customer/address');
      const raw = await r.json();
      const fresh: Address[] = Array.isArray(raw) ? raw : [];
      setAddresses(fresh);
      // Auto-select the newly added address (last in the list)
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

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <CheckoutSteps currentStep={1} />

      {loading ? (
        <CheckoutSkeleton />
      ) : (
        <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-6 pb-16 flex flex-col lg:flex-row gap-6">
          {/* ── LEFT: Customer + Addresses ── */}
          <div className="flex-1 flex flex-col gap-4">
            {/* Back to cart */}
            <button
              onClick={() => router.push('/cart')}
              className="flex items-center gap-1.5 text-[12px] cursor-pointer transition duration-150 self-start"
              style={{ color: 'var(--color-text-subtle)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-text)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-text-subtle)';
              }}
            >
              <ArrowLeft strokeWidth={1.8} className="w-3.5 h-3.5" />
              Back to Bag
            </button>

            {/* Customer Info */}
            {authInfo && (
              <div
                className="rounded-2xl p-5 border"
                style={{
                  background: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <p
                  className="text-[10px] font-semibold uppercase tracking-widest mb-4"
                  style={{ color: 'var(--color-text-subtle)' }}
                >
                  Customer
                </p>

                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-base font-semibold select-none shrink-0"
                    style={{
                      background: 'var(--color-surface-muted)',
                      color: 'var(--color-text)',
                    }}
                  >
                    {authInfo.fullName?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <span
                      className="text-[15px] font-medium"
                      style={{ color: 'var(--color-text)' }}
                    >
                      {toCapitalCase(authInfo.fullName)}
                    </span>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                      <span
                        className="flex items-center gap-1.5 text-[12px]"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        <Mail
                          strokeWidth={1.5}
                          className="w-3.5 h-3.5 shrink-0"
                        />
                        {authInfo.email}
                      </span>
                      <span
                        className="flex items-center gap-1.5 text-[12px]"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        <Phone
                          strokeWidth={1.5}
                          className="w-3.5 h-3.5 shrink-0"
                        />
                        <span style={{ fontFamily: 'Switzer', fontWeight: 500 }}>
                          {authInfo.phoneNumber}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Delivery Address */}
            <div
              className="rounded-2xl p-5 border"
              style={{
                background: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <p
                  className="text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: 'var(--color-text-subtle)' }}
                >
                  Delivery Address
                </p>
                <span
                  className="text-[11px]"
                  style={{
                    color: 'var(--color-text-subtle)',
                    fontFamily: 'Switzer', fontWeight: 500,
                  }}
                >
                  {safeAddresses.length} saved
                </span>
              </div>

              {safeAddresses.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <MapPin
                    strokeWidth={1.2}
                    className="w-8 h-8 opacity-20"
                    style={{ color: 'var(--color-text)' }}
                  />
                  <p
                    className="text-[13px]"
                    style={{ color: 'var(--color-text-subtle)' }}
                  >
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
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border-2 border-dashed text-[12.5px] font-medium cursor-pointer transition duration-150 hover:opacity-70"
                  style={{
                    borderColor: 'var(--color-border-strong)',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  <Plus strokeWidth={2} className="w-4 h-4" />
                  Add New Address
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* ── RIGHT: Order Summary ── */}
          <div className="lg:w-80 flex flex-col gap-4">
            <div
              className="rounded-2xl p-5 border lg:sticky lg:top-24"
              style={{
                background: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
              }}
            >
              <h2
                className="text-[11px] font-semibold uppercase tracking-widest mb-4"
                style={{ color: 'var(--color-text-subtle)' }}
              >
                Order Summary
              </h2>

              {/* Selected address preview */}
              {selectedAddress && (
                <div
                  className="rounded-xl p-3 mb-4"
                  style={{ background: 'var(--color-surface-muted)' }}
                >
                  <p
                    className="text-[10px] font-semibold uppercase tracking-wider mb-1"
                    style={{ color: 'var(--color-text-subtle)' }}
                  >
                    Delivering to
                  </p>
                  <p
                    className="text-[12.5px] font-medium"
                    style={{ color: 'var(--color-text)' }}
                  >
                    {selectedAddress.label} — {selectedAddress.street}
                  </p>
                  <p
                    className="text-[11.5px]"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {toCapitalCase(selectedAddress.city)},{' '}
                    <span style={{ fontFamily: 'Switzer', fontWeight: 500 }}>
                      {selectedAddress.postalCode}
                    </span>
                  </p>
                </div>
              )}

              {/* Items count */}
              {cart && (
                <p
                  className="text-[12px] mb-3"
                  style={{
                    color: 'var(--color-text-muted)',
                    fontFamily: 'Switzer', fontWeight: 500,
                  }}
                >
                  {totalQty} {totalQty === 1 ? 'Item' : 'Items'}
                </p>
              )}

              {/* Price rows */}
              <div className="flex flex-col gap-3">
                <div
                  className="flex justify-between text-[13px]"
                  style={{
                    color: 'var(--color-text-muted)',
                    fontFamily: 'Switzer', fontWeight: 500,
                  }}
                >
                  <span>
                    Subtotal{' '}
                    <span style={{ color: 'var(--color-text-subtle)' }}>
                      ({totalQty})
                    </span>
                  </span>
                  <span>{cart ? formatINR(cart.subtotal) : '—'}</span>
                </div>
                <div
                  className="flex justify-between text-[13px]"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <span>Delivery</span>
                  <span className="text-green-600 font-medium">FREE</span>
                </div>
                <div
                  className="h-px my-1"
                  style={{ background: 'var(--color-border)' }}
                />
                <div
                  className="flex justify-between text-[15px] font-bold"
                  style={{ color: 'var(--color-text)' }}
                >
                  <span>Total</span>
                  <span style={{ fontFamily: 'Switzer', fontWeight: 500 }}>
                    {cart ? formatINR(cart.estimatedTotal) : '—'}
                  </span>
                </div>
              </div>

              {/* Proceed */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                disabled={!selectedId}
                onClick={() => router.push(`/payment?addressId=${selectedId}`)}
                className="w-full mt-5 py-3.5 text-[13px] font-semibold rounded-2xl cursor-pointer flex items-center justify-center gap-2 transition duration-200 hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: 'var(--color-accent)',
                  color: 'var(--color-accent-text)',
                }}
              >
                Proceed to Payment
                <ChevronRight strokeWidth={2} className="w-4 h-4" />
              </motion.button>

              {!selectedId && (
                <p
                  className="text-center text-[11px] mt-2"
                  style={{ color: 'var(--color-text-subtle)' }}
                >
                  Select a delivery address to continue
                </p>
              )}

              <div className="flex items-center justify-center gap-1.5 mt-3">
                <ShieldCheck
                  strokeWidth={1.5}
                  className="w-3.5 h-3.5 text-emerald-500"
                />
                <span
                  className="text-[11px]"
                  style={{ color: 'var(--color-text-subtle)' }}
                >
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
