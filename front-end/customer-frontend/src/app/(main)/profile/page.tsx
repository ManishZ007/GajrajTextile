'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, AlertCircle, ChevronDown, ArrowRight } from 'lucide-react';
import { clientFetch } from '@/lib/clientFetch';
import {
  CustomerProfile,
  UpdateProfilePayload,
  isProfileComplete,
} from '@/types/customer';
import { toCapitalCase } from '@/lib/textUtils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const REQUIRED_FIELDS: { key: string; label: string }[] = [
  { key: 'fullName', label: 'Full Name' },
  { key: 'email', label: 'Email' },
  { key: 'phoneNumber', label: 'Phone Number' },
  { key: 'dateOfBirth', label: 'Date of Birth' },
  { key: 'gender', label: 'Gender' },
];

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

const INPUT_STYLE: React.CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border-strong)',
  color: 'var(--color-text)',
  borderRadius: '12px',
  padding: '11px 14px',
  fontSize: '13.5px',
  width: '100%',
  outline: 'none',
  transition: 'border-color 0.15s',
};

const INPUT_ERROR_STYLE: React.CSSProperties = {
  ...INPUT_STYLE,
  borderColor: '#ef4444',
};

const LABEL_STYLE: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 600,
  letterSpacing: '1.5px',
  textTransform: 'uppercase',
  color: 'var(--color-text-subtle)',
  marginBottom: '6px',
  display: 'block',
};

// ─── Profile Form ──────────────────────────────────────────────────────────────

interface FormState {
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const reason = searchParams.get('reason'); // 'incomplete' when pushed from checkout

  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});

  const [form, setForm] = useState<FormState>({
    fullName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: '',
  });

  useEffect(() => {
    clientFetch('/api/customer/profile')
      .then((r) => r.json())
      .then((data: CustomerProfile) => {
        setProfile(data);
        const auth = data.authentication?.auth;
        const customer = data.customer;
        setForm({
          fullName: auth?.fullName ?? '',
          email: auth?.email ?? '',
          phoneNumber: auth?.phoneNumber ?? '',
          dateOfBirth: customer?.dateOfBirth ?? '',
          gender: customer?.gender ?? '',
        });
      })
      .catch(() => setError('Could not load profile. Please refresh.'))
      .finally(() => setLoading(false));
  }, []);

  const missingFields = profile ? getMissingFields(profile) : [];
  const isIncompleteRedirect = reason === 'incomplete';

  const set = (key: keyof FormState, val: string) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  };

  const isFieldMissing = (key: keyof FormState) =>
    touched[key] && !form[key]?.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    // Mark all required as touched to show validation
    setTouched({ fullName: true, email: true, phoneNumber: true, dateOfBirth: true, gender: true });

    const requiredKeys: (keyof FormState)[] = ['fullName', 'email', 'phoneNumber', 'dateOfBirth', 'gender'];
    const hasEmpty = requiredKeys.some((k) => !form[k]?.trim());
    if (hasEmpty) return;

    setSaving(true);
    setError(null);

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

      if (redirectTo) {
        // Small delay so user sees the success flash before navigation
        setTimeout(() => router.push(redirectTo), 900);
      }
    } catch {
      setError('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* Incomplete redirect banner */}
        {isIncompleteRedirect && missingFields.length > 0 && !saved && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-4 mb-6 flex items-start gap-3"
            style={{ background: '#FEF3CD', border: '1px solid #F59E0B' }}
          >
            <AlertCircle strokeWidth={1.8} className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#B45309' }} />
            <div>
              <p className="text-[13px] font-semibold" style={{ color: '#92400E' }}>
                Complete your profile to checkout
              </p>
              <p className="text-[12px] mt-0.5" style={{ color: '#B45309' }}>
                Missing:{' '}
                <span className="font-medium">{missingFields.join(', ')}</span>
              </p>
            </div>
          </motion.div>
        )}

        {/* Success banner */}
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-4 mb-6 flex items-center gap-3"
            style={{ background: '#D1FAE5', border: '1px solid #10B981' }}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
              style={{ background: '#10B981' }}
            >
              <Check strokeWidth={2.5} className="w-3.5 h-3.5 text-white" />
            </div>
            <p className="text-[13px] font-medium" style={{ color: '#065F46' }}>
              {redirectTo
                ? 'Profile saved! Taking you back…'
                : 'Profile updated successfully.'}
            </p>
          </motion.div>
        )}

        {/* Error banner */}
        {error && (
          <div
            className="rounded-2xl p-4 mb-6 flex items-center gap-3"
            style={{ background: '#FEE2E2', border: '1px solid #EF4444' }}
          >
            <AlertCircle strokeWidth={1.8} className="w-4 h-4 shrink-0 text-red-500" />
            <p className="text-[13px]" style={{ color: '#991B1B' }}>{error}</p>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--color-text-subtle)' }}>
            My Account
          </p>
          <h1 className="text-[22px] font-light" style={{ color: 'var(--color-text)' }}>
            {isIncompleteRedirect ? 'Complete Profile' : 'Edit Profile'}
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div
            className="rounded-2xl p-5 sm:p-6 border flex flex-col gap-5"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            {/* Full Name */}
            <div>
              <label style={LABEL_STYLE}>
                Full Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => set('fullName', e.target.value)}
                placeholder="Your full name"
                style={isFieldMissing('fullName') ? INPUT_ERROR_STYLE : INPUT_STYLE}
              />
              {isFieldMissing('fullName') && (
                <p className="text-[11px] mt-1.5" style={{ color: '#ef4444' }}>Full name is required</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label style={LABEL_STYLE}>
                Email <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="you@email.com"
                style={isFieldMissing('email') ? INPUT_ERROR_STYLE : INPUT_STYLE}
              />
              {isFieldMissing('email') && (
                <p className="text-[11px] mt-1.5" style={{ color: '#ef4444' }}>Email is required</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label style={LABEL_STYLE}>
                Phone Number <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="tel"
                value={form.phoneNumber}
                onChange={(e) => set('phoneNumber', e.target.value)}
                placeholder="10-digit mobile number"
                style={isFieldMissing('phoneNumber') ? { ...INPUT_ERROR_STYLE, fontFamily: 'Switzer' } : { ...INPUT_STYLE, fontFamily: 'Switzer' }}
              />
              {isFieldMissing('phoneNumber') && (
                <p className="text-[11px] mt-1.5" style={{ color: '#ef4444' }}>Phone number is required</p>
              )}
            </div>

            {/* Date of Birth + Gender */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={LABEL_STYLE}>
                  Date of Birth <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => set('dateOfBirth', e.target.value)}
                  style={isFieldMissing('dateOfBirth') ? INPUT_ERROR_STYLE : INPUT_STYLE}
                />
                {isFieldMissing('dateOfBirth') && (
                  <p className="text-[11px] mt-1.5" style={{ color: '#ef4444' }}>Required</p>
                )}
              </div>

              <div>
                <label style={LABEL_STYLE}>
                  Gender <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div className="relative">
                  <select
                    value={form.gender}
                    onChange={(e) => set('gender', e.target.value)}
                    style={
                      isFieldMissing('gender')
                        ? { ...INPUT_ERROR_STYLE, appearance: 'none', paddingRight: '36px', cursor: 'pointer' }
                        : { ...INPUT_STYLE, appearance: 'none', paddingRight: '36px', cursor: 'pointer' }
                    }
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  <ChevronDown
                    strokeWidth={1.8}
                    className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: 'var(--color-text-subtle)' }}
                  />
                </div>
                {isFieldMissing('gender') && (
                  <p className="text-[11px] mt-1.5" style={{ color: '#ef4444' }}>Required</p>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px" style={{ background: 'var(--color-border)' }} />

            {/* Submit */}
            <motion.button
              type="submit"
              whileTap={{ scale: 0.97 }}
              disabled={saving || saved}
              className="w-full py-3.5 rounded-2xl text-[13px] font-semibold flex items-center justify-center gap-2 cursor-pointer transition duration-200 hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'var(--color-accent)', color: 'var(--color-accent-text)' }}
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving…
                </>
              ) : saved ? (
                <>
                  <Check strokeWidth={2.5} className="w-4 h-4" />
                  {redirectTo ? 'Redirecting…' : 'Saved!'}
                </>
              ) : (
                <>
                  {redirectTo ? 'Save & Continue to Checkout' : 'Save Profile'}
                  {redirectTo && <ArrowRight strokeWidth={2} className="w-4 h-4" />}
                </>
              )}
            </motion.button>
          </div>
        </form>

        {/* Skip / cancel */}
        {redirectTo && !saved && (
          <button
            onClick={() => router.push(redirectTo)}
            className="w-full mt-3 py-3 text-[12px] text-center cursor-pointer transition duration-150"
            style={{ color: 'var(--color-text-subtle)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-text)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-subtle)'; }}
          >
            Skip for now and continue anyway
          </button>
        )}
      </div>
    </div>
  );
}
