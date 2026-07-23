'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusCircle, ListChecks, ChevronRight, ChevronLeft,
  Loader2, AlertCircle, CheckCircle2, Clock, Wrench,
  X, Hash, CalendarDays, User, FileText,
} from 'lucide-react';
import { clientFetch } from '@/lib/clientFetch';
import { CustomerProfile } from '@/types/customer';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SupportCase {
  id: string;
  orderId: string | null;
  customerId: string;
  issueType: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  handledBy: string | null;
  resolutionNote: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CaseListResponse {
  content: SupportCase[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  openCount: number;
  inProgressCount: number;
  resolvedCount: number;
}

type Tab = 'new' | 'cases';

// ─── Status badge ──────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  OPEN:        { label: 'Open',        bg: '#FEF9C3', text: '#854D0E', icon: Clock    },
  IN_PROGRESS: { label: 'In Progress', bg: '#DBEAFE', text: '#1E40AF', icon: Wrench   },
  RESOLVED:    { label: 'Resolved',    bg: '#D1FAE5', text: '#065F46', icon: CheckCircle2 },
} as const;

function StatusBadge({ status }: { status: SupportCase['status'] }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-semibold"
      style={{ background: cfg.bg, color: cfg.text }}
    >
      <Icon strokeWidth={2} className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

// ─── Format date ──────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ─── Case detail panel ────────────────────────────────────────────────────────

function CaseDetail({
  caseItem,
  onBack,
}: {
  caseItem: SupportCase;
  onBack: () => void;
}) {
  return (
    <motion.div
      key="detail"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-4"
    >
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-[12px] cursor-pointer self-start"
        style={{ color: 'var(--color-text-muted)' }}
      >
        <ChevronLeft strokeWidth={2} className="w-3.5 h-3.5" />
        Back to cases
      </button>

      <div
        className="rounded-2xl border p-5 flex flex-col gap-4"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-widest mb-1"
              style={{ color: 'var(--color-text-subtle)' }}
            >
              Issue Type
            </p>
            <p className="text-[15px] font-medium" style={{ color: 'var(--color-text)' }}>
              {caseItem.issueType}
            </p>
          </div>
          <StatusBadge status={caseItem.status} />
        </div>

        <div className="h-px" style={{ background: 'var(--color-border)' }} />

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-3">
          <InfoRow icon={Hash} label="Case ID" value={caseItem.id.slice(0, 8) + '…'} mono />
          <InfoRow icon={CalendarDays} label="Opened" value={fmtDate(caseItem.createdAt)} />
          <InfoRow icon={CalendarDays} label="Updated" value={fmtDate(caseItem.updatedAt)} />
          {caseItem.orderId && <InfoRow icon={Hash} label="Order ID" value={caseItem.orderId.slice(0, 8) + '…'} mono />}
          {caseItem.handledBy && <InfoRow icon={User} label="Handled by" value={caseItem.handledBy} />}
        </div>

        <div className="h-px" style={{ background: 'var(--color-border)' }} />

        {/* Description */}
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-widest mb-2"
            style={{ color: 'var(--color-text-subtle)' }}
          >
            Description
          </p>
          <p className="text-[13px] leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            {caseItem.description}
          </p>
        </div>

        {/* Resolution note — only when RESOLVED */}
        {caseItem.status === 'RESOLVED' && caseItem.resolutionNote && (
          <>
            <div className="h-px" style={{ background: 'var(--color-border)' }} />
            <div
              className="rounded-xl p-4"
              style={{ background: '#D1FAE5', border: '1px solid #6EE7B7' }}
            >
              <p
                className="text-[10px] font-semibold uppercase tracking-widest mb-1.5"
                style={{ color: '#065F46' }}
              >
                Resolution Note
              </p>
              <p className="text-[13px] leading-relaxed" style={{ color: '#047857' }}>
                {caseItem.resolutionNote}
              </p>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-1 mb-0.5">
        <Icon strokeWidth={1.8} className="w-3 h-3" style={{ color: 'var(--color-text-subtle)' }} />
        <span
          className="text-[9.5px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--color-text-subtle)' }}
        >
          {label}
        </span>
      </div>
      <p
        className="text-[12px]"
        style={{
          color: 'var(--color-text)',
          fontFamily: 'Clamp', fontWeight: 500,
        }}
      >
        {value}
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HelpPage() {
  const [tab, setTab] = useState<Tab>('new');
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // New case form
  const [orderId, setOrderId] = useState('');
  const [issueType, setIssueType] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Case list
  const [cases, setCases] = useState<SupportCase[]>([]);
  const [casesLoading, setCasesLoading] = useState(false);
  const [casesError, setCasesError] = useState<string | null>(null);
  const [counts, setCounts] = useState({ open: 0, inProgress: 0, resolved: 0 });
  const [selectedCase, setSelectedCase] = useState<SupportCase | null>(null);

  // Load profile once
  useEffect(() => {
    clientFetch('/api/customer/profile')
      .then((r) => r.json())
      .then((d) => setProfile(d))
      .catch(() => {})
      .finally(() => setProfileLoading(false));
  }, []);

  // Load cases whenever switching to cases tab
  useEffect(() => {
    if (tab !== 'cases' || !profile?.customer?.id) return;
    loadCases(profile.customer.id);
  }, [tab, profile]);

  const loadCases = async (customerId: string) => {
    setCasesLoading(true);
    setCasesError(null);
    try {
      const r = await clientFetch(`/api/support?customerId=${customerId}&page=0&size=20`);
      const data: CaseListResponse = await r.json();
      setCases(Array.isArray(data.content) ? data.content : []);
      setCounts({
        open: data.openCount ?? 0,
        inProgress: data.inProgressCount ?? 0,
        resolved: data.resolvedCount ?? 0,
      });
    } catch {
      setCasesError('Could not load your cases. Please try again.');
    } finally {
      setCasesLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueType.trim() || !description.trim()) return;
    if (!profile?.customer?.id) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const r = await clientFetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderId.trim() || null,
          customerId: profile.customer.id,
          issueType: issueType.trim(),
          description: description.trim(),
          handledBy: null,
        }),
      });
      if (!r.ok) throw new Error('Failed');
      setSubmitSuccess(true);
      setOrderId('');
      setIssueType('');
      setDescription('');
    } catch {
      setSubmitError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '12px',
    border: '1px solid var(--color-border)',
    background: 'var(--color-surface-muted)',
    color: 'var(--color-text)',
    fontSize: '13px',
    outline: 'none',
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-10 flex flex-col gap-6">

        {/* Page header */}
        <div>
          <h1
            className="text-[22px] font-light mb-1"
            style={{ color: 'var(--color-text)', fontFamily: 'Clamp', fontWeight: 200 }}
          >
            Help & Support
          </h1>
          <p className="text-[12.5px]" style={{ color: 'var(--color-text-subtle)' }}>
            Submit a support request or track your existing cases.
          </p>
        </div>

        {/* Tab switcher */}
        <div
          className="flex rounded-xl p-1 gap-1"
          style={{ background: 'var(--color-surface-muted)' }}
        >
          {([['new', 'New Case', PlusCircle], ['cases', 'My Cases', ListChecks]] as const).map(
            ([id, label, Icon]) => (
              <button
                key={id}
                onClick={() => { setTab(id); setSelectedCase(null); setSubmitSuccess(false); }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[12.5px] font-medium cursor-pointer transition-all duration-150"
                style={{
                  background: tab === id ? 'var(--color-surface)' : 'transparent',
                  color: tab === id ? 'var(--color-text)' : 'var(--color-text-subtle)',
                  boxShadow: tab === id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                <Icon strokeWidth={1.8} className="w-3.5 h-3.5" />
                {label}
              </button>
            )
          )}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">

          {/* ── New Case tab ─────────────────────────────────────────────── */}
          {tab === 'new' && (
            <motion.div
              key="new"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col gap-4"
            >
              {/* Success banner */}
              <AnimatePresence>
                {submitSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-2xl p-4 flex items-start justify-between gap-3"
                    style={{ background: '#D1FAE5', border: '1px solid #6EE7B7' }}
                  >
                    <div className="flex items-start gap-3">
                      <CheckCircle2 strokeWidth={1.8} className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                      <p className="text-[12.5px]" style={{ color: '#065F46' }}>
                        Your case has been submitted. Our team will get back to you soon.
                      </p>
                    </div>
                    <button onClick={() => setSubmitSuccess(false)} className="shrink-0 cursor-pointer">
                      <X strokeWidth={2} className="w-3.5 h-3.5 text-emerald-700" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error banner */}
              <AnimatePresence>
                {submitError && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-2xl p-4 flex items-start gap-3"
                    style={{ background: '#FEE2E2', border: '1px solid #FCA5A5' }}
                  >
                    <AlertCircle strokeWidth={1.8} className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                    <p className="text-[12.5px]" style={{ color: '#991B1B' }}>{submitError}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <div
                className="rounded-2xl border p-5"
                style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
              >
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                  {/* Order ID (optional) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-subtle)' }}>
                      Order ID <span style={{ color: 'var(--color-text-subtle)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. a1b2c3d4-..."
                      value={orderId}
                      onChange={(e) => setOrderId(e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  {/* Issue type */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-subtle)' }}>
                      Issue Type <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Damaged product, Wrong item, Payment issue…"
                      value={issueType}
                      onChange={(e) => setIssueType(e.target.value)}
                      required
                      style={inputStyle}
                    />
                  </div>

                  {/* Description */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-subtle)' }}>
                      Description <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <textarea
                      placeholder="Describe the issue in detail…"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      rows={5}
                      style={{ ...inputStyle, resize: 'vertical', minHeight: '110px' }}
                    />
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    disabled={submitting || profileLoading || !profile}
                    className="w-full py-3.5 rounded-2xl text-[13px] font-semibold flex items-center justify-center gap-2 cursor-pointer transition duration-200 hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: 'var(--color-accent)', color: 'var(--color-accent-text)' }}
                  >
                    {submitting ? (
                      <>
                        <Loader2 strokeWidth={2} className="w-4 h-4 animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      'Submit Case'
                    )}
                  </motion.button>
                </form>
              </div>
            </motion.div>
          )}

          {/* ── My Cases tab ─────────────────────────────────────────────── */}
          {tab === 'cases' && (
            <motion.div
              key="cases"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col gap-4"
            >
              <AnimatePresence mode="wait">
                {selectedCase ? (
                  <CaseDetail
                    key="detail"
                    caseItem={selectedCase}
                    onBack={() => setSelectedCase(null)}
                  />
                ) : (
                  <motion.div
                    key="list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col gap-4"
                  >
                    {/* Stats row */}
                    {cases.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: 'Open', count: counts.open, bg: '#FEF9C3', text: '#854D0E' },
                          { label: 'In Progress', count: counts.inProgress, bg: '#DBEAFE', text: '#1E40AF' },
                          { label: 'Resolved', count: counts.resolved, bg: '#D1FAE5', text: '#065F46' },
                        ].map(({ label, count, bg, text }) => (
                          <div
                            key={label}
                            className="rounded-xl p-3 text-center"
                            style={{ background: bg }}
                          >
                            <p
                              className="text-[18px] font-bold"
                              style={{ color: text, fontFamily: 'Clamp', fontWeight: 500 }}
                            >
                              {count}
                            </p>
                            <p className="text-[10px] font-semibold" style={{ color: text }}>
                              {label}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Error */}
                    {casesError && (
                      <div
                        className="rounded-2xl p-4 flex items-center gap-3"
                        style={{ background: '#FEE2E2', border: '1px solid #FCA5A5' }}
                      >
                        <AlertCircle strokeWidth={1.8} className="w-4 h-4 shrink-0 text-red-500" />
                        <p className="text-[12.5px]" style={{ color: '#991B1B' }}>{casesError}</p>
                      </div>
                    )}

                    {/* Loading skeletons */}
                    {casesLoading && (
                      <div className="flex flex-col gap-3">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="h-20 rounded-2xl"
                            style={{
                              background: 'linear-gradient(90deg, #ede8e2 25%, #f5f0ea 50%, #ede8e2 75%)',
                              backgroundSize: '200% 100%',
                              animation: `skeleton-shimmer 1.6s infinite`,
                              animationDelay: `${i * 0.1}s`,
                            }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Empty state */}
                    {!casesLoading && cases.length === 0 && !casesError && (
                      <div
                        className="rounded-2xl border p-10 flex flex-col items-center gap-3 text-center"
                        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                      >
                        <FileText strokeWidth={1.2} className="w-10 h-10" style={{ color: 'var(--color-text-subtle)' }} />
                        <p className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>
                          No support cases yet.
                        </p>
                        <button
                          onClick={() => setTab('new')}
                          className="text-[12px] font-medium underline cursor-pointer"
                          style={{ color: 'var(--color-text)' }}
                        >
                          Submit your first case
                        </button>
                      </div>
                    )}

                    {/* Case list */}
                    {!casesLoading && cases.length > 0 && (
                      <div className="flex flex-col gap-2.5">
                        {cases.map((c) => (
                          <motion.button
                            key={c.id}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => setSelectedCase(c)}
                            className="w-full text-left rounded-2xl border p-4 flex items-center gap-4 cursor-pointer transition-all duration-150 hover:shadow-sm"
                            style={{
                              background: 'var(--color-surface)',
                              borderColor: 'var(--color-border)',
                            }}
                          >
                            {/* Status dot */}
                            <div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{
                                background:
                                  c.status === 'RESOLVED' ? '#10B981'
                                  : c.status === 'IN_PROGRESS' ? '#3B82F6'
                                  : '#F59E0B',
                              }}
                            />

                            <div className="flex-1 min-w-0">
                              <p
                                className="text-[13px] font-medium truncate"
                                style={{ color: 'var(--color-text)' }}
                              >
                                {c.issueType}
                              </p>
                              <p
                                className="text-[11px] mt-0.5"
                                style={{ color: 'var(--color-text-subtle)', fontFamily: 'Clamp', fontWeight: 500 }}
                              >
                                {fmtDate(c.createdAt)}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <StatusBadge status={c.status} />
                              <ChevronRight strokeWidth={1.8} className="w-4 h-4" style={{ color: 'var(--color-text-subtle)' }} />
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
