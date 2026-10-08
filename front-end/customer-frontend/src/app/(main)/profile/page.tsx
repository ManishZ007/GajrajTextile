'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, AlertCircle, ChevronDown, Loader2,
  Plus, Pencil, Trash2, X, MapPin, Package, Heart, Lock, ArrowRight,
} from 'lucide-react';
import { clientFetch } from '@/lib/clientFetch';
import {
  CustomerProfile,
  UpdateProfilePayload,
  Address,
  AddressFormData,
} from '@/types/customer';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMissingFields(profile: CustomerProfile): string[] {
  const auth = profile.authentication?.auth;
  const customer = profile.customer;
  const missing: string[] = [];
  if (!auth?.fullName?.trim()) missing.push('Full Name');
  if (!auth?.email?.trim()) missing.push('Email');
  if (!auth?.phoneNumber?.trim()) missing.push('Phone Number');
  if (!customer?.dateOfBirth?.trim()) missing.push('Date of Birth');
  if (!customer?.gender?.trim()) missing.push('Gender');
  return missing;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const inputCls = (hasError = false) =>
  `w-full bg-transparent text-[13.5px] font-light text-[#1B1B1B] pb-3 pt-1 outline-none placeholder:text-[#1B1B1B]/25 transition-colors duration-200 ${
    hasError
      ? 'border-b border-red-400 focus:border-red-500'
      : 'border-b border-black/15 focus:border-[#1B1B1B]'
  }`;

const labelCls = 'block text-[0.7rem] tracking-[1.5px] uppercase text-[#1B1B1B]/55 mb-2.5';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
}

interface PwForm {
  next: string;
  confirm: string;
}

const emptyAddress: AddressFormData = {
  label: '', street: '', city: '', state: '', postalCode: '', country: 'India', isDefault: false,
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const redirectTo = searchParams.get('redirect');
  const reason = searchParams.get('reason');

  // ── Profile ──
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [form, setForm] = useState<FormState>({
    fullName: '', email: '', phoneNumber: '', dateOfBirth: '', gender: '',
  });
  const initialForm = useRef<FormState>({ fullName: '', email: '', phoneNumber: '', dateOfBirth: '', gender: '' });

  // ── Addresses ──
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addrFormOpen, setAddrFormOpen] = useState(false);
  const [editingAddrId, setEditingAddrId] = useState<number | null>(null);
  const [addrForm, setAddrForm] = useState<AddressFormData>(emptyAddress);
  const [addrSaving, setAddrSaving] = useState(false);
  const [addrError, setAddrError] = useState<string | null>(null);

  // ── Change Password ──
  const [pwModal, setPwModal] = useState(false);
  const [pwForm, setPwForm] = useState<PwForm>({ next: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  // ── Load profile ──
  useEffect(() => {
    if (status === 'unauthenticated') { router.replace('/login'); return; }
    if (status !== 'authenticated') return;
    clientFetch('/api/customer/profile')
      .then((r) => r.json())
      .then((data: CustomerProfile) => {
        setProfile(data);
        const auth = data.authentication?.auth;
        const customer = data.customer;
        const loaded: FormState = {
          fullName: auth?.fullName ?? '',
          email: auth?.email ?? '',
          phoneNumber: auth?.phoneNumber ?? '',
          dateOfBirth: customer?.dateOfBirth ?? '',
          gender: customer?.gender ?? '',
        };
        setForm(loaded);
        initialForm.current = loaded;
        setAddresses(customer?.addresses ?? []);
      })
      .catch(() => setPageError('Could not load profile. Please refresh.'))
      .finally(() => setLoading(false));
  }, [status, router]);

  const isDirty = (Object.keys(form) as (keyof FormState)[]).some(
    (k) => form[k] !== initialForm.current[k]
  );

  const missingFields = profile ? getMissingFields(profile) : [];
  const isIncompleteRedirect = reason === 'incomplete';

  const setField = (key: keyof FormState, val: string) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  };

  const isFieldMissing = (key: keyof FormState) => touched[key] && !form[key]?.trim();

  // ── Save profile ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setTouched({ fullName: true, email: true, phoneNumber: true, dateOfBirth: true, gender: true });
    const required: (keyof FormState)[] = ['fullName', 'email', 'phoneNumber', 'dateOfBirth', 'gender'];
    if (required.some((k) => !form[k]?.trim())) return;

    setSaving(true);
    setPageError(null);

    const payload: UpdateProfilePayload & { userId: string; customerId: string } = {
      userId: profile.authentication.auth.userId,
      customerId: profile.customer.id,
      userType: 'CUSTOMER',
      userInfo: {
        full_name: form.fullName.trim(),
        email: form.email.trim(),
        phone_number: form.phoneNumber.trim(),
      },
      customer: {
        gender: form.gender.trim(),
        profile_image_url: null,
        date_of_birth: form.dateOfBirth.trim(),
      },
    };

    try {
      await clientFetch('/api/customer/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setSaved(true);
      initialForm.current = { ...form };
      if (redirectTo) {
        setTimeout(() => router.push(redirectTo), 900);
      } else {
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      setPageError('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Address CRUD ──
  const openAddAddress = () => {
    setAddrForm(emptyAddress);
    setEditingAddrId(null);
    setAddrFormOpen(true);
    setAddrError(null);
  };

  const openEditAddress = (addr: Address) => {
    setAddrForm({
      label: addr.label, street: addr.street, city: addr.city,
      state: addr.state, postalCode: addr.postalCode, country: addr.country,
      isDefault: addr.isDefault,
    });
    setEditingAddrId(addr.id);
    setAddrFormOpen(true);
    setAddrError(null);
  };

  const handleSaveAddress = async () => {
    if (!addrForm.street.trim() || !addrForm.city.trim() || !addrForm.state.trim() || !addrForm.postalCode.trim()) {
      setAddrError('Street, city, state and postal code are required.'); return;
    }
    setAddrSaving(true);
    setAddrError(null);
    try {
      if (editingAddrId !== null) {
        const res = await clientFetch(`/api/customer/address/${editingAddrId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(addrForm),
        });
        const updated: Address = await res.json();
        setAddresses((prev) => prev.map((a) => (a.id === editingAddrId ? updated : a)));
      } else {
        const res = await clientFetch('/api/customer/address', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(addrForm),
        });
        const created: Address = await res.json();
        setAddresses((prev) => [...prev, created]);
      }
      setAddrFormOpen(false);
    } catch {
      setAddrError('Could not save address. Please try again.');
    } finally {
      setAddrSaving(false);
    }
  };

  const handleDeleteAddress = async (id: number) => {
    try {
      await clientFetch(`/api/customer/address/${id}`, { method: 'DELETE' });
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch { /* silent */ }
  };

  // ── Change password ──
  const handleChangePassword = async () => {
    if (!pwForm.next.trim() || !pwForm.confirm.trim()) {
      setPwError('All fields are required.'); return;
    }
    if (pwForm.next !== pwForm.confirm) {
      setPwError('Passwords do not match.'); return;
    }
    if (pwForm.next.length < 8) {
      setPwError('Password must be at least 8 characters.'); return;
    }
    setPwSaving(true);
    setPwError(null);
    try {
      await clientFetch('/api/customer/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: pwForm.next }),
      });
      setPwSuccess(true);
      setTimeout(() => {
        setPwModal(false);
        setPwSuccess(false);
        setPwForm({ next: '', confirm: '' });
      }, 1500);
    } catch {
      setPwError('Current password is incorrect or could not be changed.');
    } finally {
      setPwSaving(false);
    }
  };

  const openPwModal = () => {
    setPwModal(true);
    setPwError(null);
    setPwSuccess(false);
    setPwForm({ next: '', confirm: '' });
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 strokeWidth={1.5} className="w-5 h-5 animate-spin text-[#1B1B1B]/25" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">

      {/* ── Page header + tab bar ── */}
      <div className="border-b border-black/[0.07] px-6 sm:px-16 pt-16 sm:pt-20">
        <h1 className="font-light text-[#1B1B1B] tracking-[-0.01em] mb-8"
          style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}>
          My Account
        </h1>
        <div className="flex items-end gap-0 overflow-x-auto">
          {(['My Profile', 'My Orders', 'My Wishlist'] as const).map((label) => {
            const isActive = label === 'My Profile';
            return (
              <button
                key={label}
                onClick={() => {
                  if (label === 'My Orders') router.push('/orders');
                  else if (label === 'My Wishlist') router.push('/wishlist');
                }}
                className={`px-5 pb-3.5 pt-1 text-[0.72rem] tracking-[1.5px] uppercase whitespace-nowrap bg-transparent border-0 cursor-pointer transition-colors duration-200 ${
                  isActive
                    ? 'text-[#1B1B1B] border-b-[1.5px] border-[#1B1B1B]'
                    : 'text-[#1B1B1B]/40 hover:text-[#1B1B1B]/70 border-b-[1.5px] border-transparent'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Banners ── */}
      <div className="px-6 sm:px-16 pt-6 flex flex-col gap-3">
        <AnimatePresence>
          {isIncompleteRedirect && missingFields.length > 0 && !saved && (
            <motion.div key="incomplete" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-start gap-3 p-4"
              style={{ borderLeft: '2px solid rgba(27,27,27,0.3)', background: 'rgba(27,27,27,0.03)' }}>
              <AlertCircle strokeWidth={1.5} className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#1B1B1B]/40" />
              <div className="flex flex-col gap-0.5">
                <p className="text-[0.7rem] tracking-[1.5px] uppercase text-[#1B1B1B]/65">Complete your profile to checkout</p>
                <p className="text-[12.5px] font-light text-[#1B1B1B]/45">
                  Missing: <span className="text-[#1B1B1B]/65">{missingFields.join(', ')}</span>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {saved && (
            <motion.div key="saved" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 p-4"
              style={{ borderLeft: '2px solid rgba(27,27,27,0.4)', background: 'rgba(27,27,27,0.03)' }}>
              <Check strokeWidth={2} className="w-3.5 h-3.5 shrink-0 text-[#1B1B1B]/50" />
              <p className="text-[0.7rem] tracking-[1.5px] uppercase text-[#1B1B1B]/65">
                {redirectTo ? 'Profile saved — taking you back…' : 'Profile updated successfully'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {pageError && (
            <motion.div key="error" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 p-4"
              style={{ borderLeft: '2px solid rgba(220,50,50,0.5)', background: 'rgba(255,235,235,0.5)' }}>
              <AlertCircle strokeWidth={1.5} className="w-3.5 h-3.5 shrink-0 text-red-400" />
              <p className="text-[12.5px] font-light text-[#1B1B1B]/65">{pageError}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Two-column layout ── */}
      <div className="px-6 sm:px-16 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-16 lg:gap-24 max-w-6xl">

          {/* ─── LEFT: Personal Information ─── */}
          <section>
            <h2 className="text-[0.7rem] tracking-[2px] uppercase text-[#1B1B1B]/35 mb-8">
              Personal Information
            </h2>
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-7">
              <div>
                <label className={labelCls}>Full Name <span className="text-red-400">*</span></label>
                <input type="text" value={form.fullName} onChange={(e) => setField('fullName', e.target.value)}
                  placeholder="Your full name" className={inputCls(isFieldMissing('fullName'))} />
                {isFieldMissing('fullName') && <p className="text-[11px] font-light text-red-400 mt-1.5">Full name is required</p>}
              </div>

              <div>
                <label className={labelCls}>Email <span className="text-red-400">*</span></label>
                <input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)}
                  placeholder="you@email.com" className={inputCls(isFieldMissing('email'))} />
                {isFieldMissing('email') && <p className="text-[11px] font-light text-red-400 mt-1.5">Email is required</p>}
              </div>

              <div>
                <label className={labelCls}>Phone Number <span className="text-red-400">*</span></label>
                <input type="tel" value={form.phoneNumber} onChange={(e) => setField('phoneNumber', e.target.value)}
                  placeholder="10-digit mobile number" className={inputCls(isFieldMissing('phoneNumber'))} />
                {isFieldMissing('phoneNumber') && <p className="text-[11px] font-light text-red-400 mt-1.5">Phone number is required</p>}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className={labelCls}>Date of Birth <span className="text-red-400">*</span></label>
                  <input type="date" value={form.dateOfBirth} onChange={(e) => setField('dateOfBirth', e.target.value)}
                    className={inputCls(isFieldMissing('dateOfBirth'))} />
                  {isFieldMissing('dateOfBirth') && <p className="text-[11px] font-light text-red-400 mt-1.5">Required</p>}
                </div>
                <div>
                  <label className={labelCls}>Gender <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <select value={form.gender} onChange={(e) => setField('gender', e.target.value)}
                      className={inputCls(isFieldMissing('gender')) + ' appearance-none pr-6 cursor-pointer'}>
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    <ChevronDown strokeWidth={1.5} className="w-3.5 h-3.5 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-[#1B1B1B]/30" />
                  </div>
                  {isFieldMissing('gender') && <p className="text-[11px] font-light text-red-400 mt-1.5">Required</p>}
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-3">
                <button type="submit" disabled={saving || saved || !isDirty}
                  className="w-full py-4 bg-black rounded-full  text-white text-[0.725rem] tracking-[1.5px] uppercase hover:opacity-80 transition-opacity duration-200 cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed">
                  {saving ? (
                    <><Loader2 strokeWidth={2} className="w-3.5 h-3.5 animate-spin" />Saving…</>
                  ) : saved ? (
                    <><Check strokeWidth={2} className="w-3.5 h-3.5" />{redirectTo ? 'Redirecting…' : 'Saved'}</>
                  ) : (
                    <>{redirectTo ? 'Save & Continue to Checkout' : 'Save Profile'}{redirectTo && <ArrowRight strokeWidth={1.5} className="w-3.5 h-3.5" />}</>
                  )}
                </button>
                {redirectTo && !saved && (
                  <button type="button" onClick={() => router.push(redirectTo)}
                    className="w-full py-3 text-[0.7rem] tracking-[1.5px] uppercase text-[#1B1B1B]/35 hover:text-[#1B1B1B]/60 transition-colors duration-200 cursor-pointer text-center">
                    Skip for now
                  </button>
                )}
              </div>
            </form>
          </section>

          {/* ─── RIGHT: Login Info + Address Book + Quick Links ─── */}
          <aside className="flex flex-col gap-12">

            {/* Login Information */}
            <section>
              <h2 className="text-[0.7rem] tracking-[2px] uppercase text-[#1B1B1B]/35 mb-8">
                Login Information
              </h2>
              <div className="flex flex-col gap-6">
                <div>
                  <label className={labelCls}>Email</label>
                  <p className="text-[13.5px] font-light text-[#1B1B1B] pb-3 border-b border-black/10">
                    {profile?.authentication?.auth?.email ?? '—'}
                  </p>
                </div>
                <div>
                  <label className={labelCls}>Password</label>
                  <button onClick={openPwModal}
                    className="flex items-center gap-2 mt-1 text-[0.72rem] tracking-[1.5px] uppercase text-[#1B1B1B] hover:text-[#1B1B1B]/50 transition-colors duration-200 cursor-pointer bg-transparent border-0 p-0">
                    <Lock strokeWidth={1.5} className="w-3.5 h-3.5" />
                    Change Password
                  </button>
                </div>
              </div>
            </section>

            {/* Address Book */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-[0.7rem] tracking-[2px] uppercase text-[#1B1B1B]/35">
                  My Address Book
                </h2>
                {!addrFormOpen && (
                  <button onClick={openAddAddress}
                    className="flex items-center gap-1.5 text-[0.68rem] tracking-[1px] uppercase text-[#1B1B1B]/40 hover:text-[#1B1B1B] transition-colors duration-200 cursor-pointer bg-transparent border-0 p-0">
                    <Plus strokeWidth={1.5} className="w-3.5 h-3.5" />
                    Add New
                  </button>
                )}
              </div>

              {addresses.length === 0 && !addrFormOpen && (
                <p className="text-[13px] font-light text-[#1B1B1B]/30">No addresses saved yet.</p>
              )}

              <div className="flex flex-col gap-0">
                {addresses.map((addr) => (
                  <div key={addr.id} className="flex items-start justify-between gap-4 py-5 border-b border-black/[0.07] first:border-t first:border-black/[0.07]">
                    <div className="flex gap-3">
                      <MapPin strokeWidth={1.5} className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#1B1B1B]/25" />
                      <div>
                        <p className="text-[0.65rem] tracking-[1.5px] uppercase text-[#1B1B1B]/45 mb-1.5">
                          {addr.label || 'Address'}
                          {addr.isDefault && <span className="ml-2 text-[#1B1B1B]/25">· Default</span>}
                        </p>
                        <p className="text-[13px] font-light text-[#1B1B1B] leading-[1.8]">
                          {addr.street}<br />
                          {addr.city}, {addr.state} {addr.postalCode}<br />
                          {addr.country}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3 shrink-0 pt-0.5">
                      <button onClick={() => openEditAddress(addr)}
                        className="text-[#1B1B1B]/25 hover:text-[#1B1B1B] transition-colors duration-200 cursor-pointer bg-transparent border-0 p-0">
                        <Pencil strokeWidth={1.5} className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteAddress(addr.id)}
                        className="text-[#1B1B1B]/25 hover:text-red-400 transition-colors duration-200 cursor-pointer bg-transparent border-0 p-0">
                        <Trash2 strokeWidth={1.5} className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Inline address form */}
              <AnimatePresence>
                {addrFormOpen && (
                  <motion.div key="addr-form"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                    className="mt-6 pt-6 border-t border-black/[0.07] flex flex-col gap-5">
                    <div className="flex items-center justify-between">
                      <p className="text-[0.7rem] tracking-[1.5px] uppercase text-[#1B1B1B]/55">
                        {editingAddrId !== null ? 'Edit Address' : 'New Address'}
                      </p>
                      <button onClick={() => setAddrFormOpen(false)}
                        className="text-[#1B1B1B]/30 hover:text-[#1B1B1B] transition-colors duration-200 cursor-pointer bg-transparent border-0 p-0">
                        <X strokeWidth={1.5} className="w-4 h-4" />
                      </button>
                    </div>

                    {addrError && <p className="text-[11px] font-light text-red-400">{addrError}</p>}

                    <div>
                      <label className={labelCls}>Label (e.g. Home, Office)</label>
                      <input type="text" value={addrForm.label}
                        onChange={(e) => setAddrForm((p) => ({ ...p, label: e.target.value }))}
                        placeholder="Home" className={inputCls()} />
                    </div>
                    <div>
                      <label className={labelCls}>Street Address <span className="text-red-400">*</span></label>
                      <input type="text" value={addrForm.street}
                        onChange={(e) => setAddrForm((p) => ({ ...p, street: e.target.value }))}
                        placeholder="123 MG Road, Apt 4" className={inputCls()} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>City <span className="text-red-400">*</span></label>
                        <input type="text" value={addrForm.city}
                          onChange={(e) => setAddrForm((p) => ({ ...p, city: e.target.value }))}
                          placeholder="Mumbai" className={inputCls()} />
                      </div>
                      <div>
                        <label className={labelCls}>State <span className="text-red-400">*</span></label>
                        <input type="text" value={addrForm.state}
                          onChange={(e) => setAddrForm((p) => ({ ...p, state: e.target.value }))}
                          placeholder="Maharashtra" className={inputCls()} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Postal Code <span className="text-red-400">*</span></label>
                        <input type="text" value={addrForm.postalCode}
                          onChange={(e) => setAddrForm((p) => ({ ...p, postalCode: e.target.value }))}
                          placeholder="400001" className={inputCls()} />
                      </div>
                      <div>
                        <label className={labelCls}>Country</label>
                        <input type="text" value={addrForm.country}
                          onChange={(e) => setAddrForm((p) => ({ ...p, country: e.target.value }))}
                          placeholder="India" className={inputCls()} />
                      </div>
                    </div>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input type="checkbox" checked={addrForm.isDefault}
                        onChange={(e) => setAddrForm((p) => ({ ...p, isDefault: e.target.checked }))}
                        className="w-3.5 h-3.5 accent-[#1B1B1B] cursor-pointer" />
                      <span className="text-[12.5px] font-light text-[#1B1B1B]/55">Set as default address</span>
                    </label>

                    <div className="flex gap-3">
                      <button onClick={handleSaveAddress} disabled={addrSaving}
                        className="flex-1 py-3.5 bg-black rounded-full  text-white text-[0.7rem] tracking-[1.5px] uppercase hover:opacity-80 transition-opacity duration-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                        {addrSaving
                          ? <><Loader2 strokeWidth={2} className="w-3.5 h-3.5 animate-spin" />Saving…</>
                          : 'Save Address'}
                      </button>
                      <button onClick={() => setAddrFormOpen(false)}
                        className="px-5 py-3.5 text-[0.7rem] tracking-[1.5px] uppercase text-[#1B1B1B]/40 hover:text-[#1B1B1B] border border-black/15 hover:border-black/40 transition-colors duration-200 cursor-pointer bg-transparent">
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* Quick access */}
            <section>
              <h2 className="text-[0.7rem] tracking-[2px] uppercase text-[#1B1B1B]/35 mb-6">
                Quick Access
              </h2>
              <div className="flex flex-col">
                <button onClick={() => router.push('/orders')}
                  className="flex items-center justify-between py-4 border-b border-black/[0.07] border-t border-t-black/[0.07] bg-transparent cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <Package strokeWidth={1.5} className="w-4 h-4 text-[#1B1B1B]/25" />
                    <span className="text-[13.5px] font-light text-[#1B1B1B]">My Orders</span>
                  </div>
                  <ArrowRight strokeWidth={1.5} className="w-3.5 h-3.5 text-[#1B1B1B]/25 group-hover:translate-x-0.5 transition-transform duration-200" />
                </button>
                <button onClick={() => router.push('/wishlist')}
                  className="flex items-center justify-between py-4 border-b border-black/[0.07] bg-transparent cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <Heart strokeWidth={1.5} className="w-4 h-4 text-[#1B1B1B]/25" />
                    <span className="text-[13.5px] font-light text-[#1B1B1B]">My Wishlist</span>
                  </div>
                  <ArrowRight strokeWidth={1.5} className="w-3.5 h-3.5 text-[#1B1B1B]/25 group-hover:translate-x-0.5 transition-transform duration-200" />
                </button>
              </div>
            </section>
          </aside>
        </div>
      </div>

      {/* ── Change Password Modal ── */}
      <AnimatePresence>
        {pwModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/25 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setPwModal(false); }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 12 }}
              className="bg-white w-full max-w-sm p-8 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h2 className="text-[0.7rem] tracking-[2px] uppercase text-[#1B1B1B]">Change Password</h2>
                <button onClick={() => setPwModal(false)}
                  className="text-[#1B1B1B]/30 hover:text-[#1B1B1B] transition-colors cursor-pointer bg-transparent border-0 p-0">
                  <X strokeWidth={1.5} className="w-4 h-4" />
                </button>
              </div>

              <AnimatePresence>
                {pwError && (
                  <motion.p key="pw-err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="text-[11px] font-light text-red-400">
                    {pwError}
                  </motion.p>
                )}
                {pwSuccess && (
                  <motion.div key="pw-ok" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2 text-[0.7rem] tracking-[1.5px] uppercase text-[#1B1B1B]/60">
                    <Check strokeWidth={2} className="w-3.5 h-3.5" /> Password changed
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-col gap-6">
                <div>
                  <label className={labelCls}>New Password</label>
                  <input type="password" value={pwForm.next}
                    onChange={(e) => setPwForm((p) => ({ ...p, next: e.target.value }))}
                    placeholder="Min. 8 characters" className={inputCls()} />
                </div>
                <div>
                  <label className={labelCls}>Confirm New Password</label>
                  <input type="password" value={pwForm.confirm}
                    onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
                    placeholder="Repeat new password" className={inputCls()} />
                </div>
              </div>

              <button onClick={handleChangePassword} disabled={pwSaving || pwSuccess}
                className="w-full py-4 bg-black rounded-full  text-white text-[0.725rem] tracking-[1.5px] uppercase hover:opacity-80 transition-opacity duration-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                {pwSaving
                  ? <><Loader2 strokeWidth={2} className="w-3.5 h-3.5 animate-spin" />Updating…</>
                  : 'Update Password'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
