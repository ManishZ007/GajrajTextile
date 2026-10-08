'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader2, X, LogIn, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { clientFetch } from '@/lib/clientFetch';
import { CustomerProfile } from '@/types/customer';
import Footer from '@/components/Footer/Footer';

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const STATUS_LABEL: Record<SupportCase['status'], string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
};

const STATUS_DOT: Record<SupportCase['status'], string> = {
  OPEN: '#6B7280',
  IN_PROGRESS: '#D97706',
  RESOLVED: '#16A34A',
};

// ─── Case detail ──────────────────────────────────────────────────────────────

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
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-8"
    >
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-[11px] tracking-[1.5px] uppercase text-[#1B1B1B]/85 transition-colors cursor-pointer w-fit"
      >
        <ChevronLeft size={12} strokeWidth={1.5} />
        All Cases
      </button>

      <div className="border-t border-black/8 pt-8 flex flex-col gap-6">
        {/* Issue type + status */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/75 mb-2">
              Issue
            </p>
            <p className="text-[1.1rem] font-light text-[#1B1B1B] leading-snug">
              {caseItem.issueType}
            </p>
          </div>
          <span className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/75 border border-black/45 rounded px-3 py-1 shrink-0">
            {STATUS_LABEL[caseItem.status]}
          </span>
        </div>

        <div className="h-px bg-black/8" />

        {/* Meta */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-5">
          {[
            { label: 'Case ID', value: caseItem.id.slice(0, 8) + '…' },
            { label: 'Opened', value: fmtDate(caseItem.createdAt) },
            { label: 'Last Updated', value: fmtDate(caseItem.updatedAt) },
            ...(caseItem.orderId
              ? [
                  {
                    label: 'Order ID',
                    value: caseItem.orderId.slice(0, 8) + '…',
                  },
                ]
              : []),
            ...(caseItem.handledBy
              ? [{ label: 'Handled By', value: caseItem.handledBy }]
              : []),
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/75 mb-1">
                {label}
              </p>
              <p className="text-[13px] font-light text-[#1B1B1B]">{value}</p>
            </div>
          ))}
        </div>

        <div className="h-px bg-black/8" />

        {/* Description */}
        <div>
          <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/75 mb-3">
            Description
          </p>
          <p className="text-[13.5px] text-[#1B1B1B]/95 font-light leading-[1.8]">
            {caseItem.description}
          </p>
        </div>

        {/* Resolution note */}
        {caseItem.status === 'RESOLVED' && caseItem.resolutionNote && (
          <>
            <div className="h-px bg-black/8" />
            <div className="border border-black/55 rounded px-6 py-5">
              <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/75 mb-3">
                Resolution Note
              </p>
              <p className="text-[13.5px] text-[#1B1B1B]/75 font-light leading-[1.8]">
                {caseItem.resolutionNote}
              </p>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

// ─── Guest state ──────────────────────────────────────────────────────────────

function GuestHelp() {
  const router = useRouter();
  return (
    <div className="flex flex-col items-start gap-6 py-8">
      <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95">
        Sign in to continue
      </p>
      <p className="text-[13px] font-light text-[#1B1B1B]/50 leading-[1.75] max-w-sm">
        Submit a support case or track your existing cases — you need to be
        signed in to access this section.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => router.push('/login')}
          className="flex items-center justify-center gap-2.5 px-8 py-3.5 text-[0.7rem] tracking-[2px] uppercase font-light text-white bg-black rounded-full transition-opacity duration-200 hover:opacity-80 cursor-pointer"
        >
          <LogIn strokeWidth={1} className="w-3.5 h-3.5" />
          Sign In
        </button>
        <button
          onClick={() => router.push('/register')}
          className="flex items-center justify-center gap-2.5 px-8 py-3.5 text-[0.7rem] tracking-[2px] uppercase font-light text-[#1B1B1B] transition-opacity duration-200 hover:opacity-75 cursor-pointer"
          style={{ border: '1px solid rgba(27,27,27,0.20)' }}
        >
          <UserPlus strokeWidth={1} className="w-3.5 h-3.5" />
          Create Account
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HelpPage() {
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';

  const [tab, setTab] = useState<Tab>('new');
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [orderId, setOrderId] = useState('');
  const [issueType, setIssueType] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [cases, setCases] = useState<SupportCase[]>([]);
  const [casesLoading, setCasesLoading] = useState(false);
  const [casesError, setCasesError] = useState<string | null>(null);
  const [counts, setCounts] = useState({ open: 0, inProgress: 0, resolved: 0 });
  const [selectedCase, setSelectedCase] = useState<SupportCase | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setProfileLoading(false);
      return;
    }
    clientFetch('/api/customer/profile')
      .then((r) => r.json())
      .then((d) => setProfile(d))
      .catch(() => {})
      .finally(() => setProfileLoading(false));
  }, [isAuthenticated]);

  useEffect(() => {
    if (tab !== 'cases' || !profile?.customer?.id) return;
    loadCases(profile.customer.id);
  }, [tab, profile]);

  const loadCases = async (customerId: string) => {
    setCasesLoading(true);
    setCasesError(null);
    try {
      const r = await clientFetch(
        `/api/support?customerId=${customerId}&page=0&size=20`
      );
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
    if (!issueType.trim() || !description.trim() || !profile?.customer?.id)
      return;
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

  const fieldClass =
    'w-full border-b border-black/12 bg-transparent text-[13.5px] font-light text-[#1B1B1B] placeholder:text-[#1B1B1B]/25 py-3 outline-none focus:border-[#1B1B1B]/40 transition-colors duration-200';

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="px-6 md:px-12 lg:px-16 pt-14 pb-12 border-b border-black/8">
        <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#060606]/95 mb-5">
          Support
        </p>
        <h1
          className="font-light text-[#1B1B1B] leading-[1.08] tracking-[-0.02em]"
          style={{ fontSize: 'clamp(2rem, 5vw, 4rem)' }}
        >
          Help &amp;
          <br />
          Customer Care
        </h1>
        <p className="mt-5 text-[13px] text-[#1B1B1B]/45 max-w-md leading-[1.75] font-light">
          Submit a new support request or track the status of an existing case.
          Our team is available Monday to Saturday, 10 am – 6 pm IST.
        </p>
      </section>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* LEFT — info panel */}
        <div className="w-full lg:w-[42%] lg:border-r border-black/8 px-6 md:px-12 lg:px-16 py-12">
          {/* We can help with */}
          <div className="mb-12">
            <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#060606]/95 mb-5">
              We can help with
            </p>
            <div className="border-t border-black/8">
              {[
                'Order status &amp; tracking',
                'Returns &amp; refunds',
                'Payment issues',
                'Damaged or wrong items',
                'Custom order queries',
                'Saree care &amp; aftercare',
                'Account &amp; profile help',
              ].map((topic) => (
                <div
                  key={topic}
                  className="border-b border-black/8 py-4 text-[13.5px] font-light text-[#1B1B1B]/65 leading-snug"
                  dangerouslySetInnerHTML={{ __html: topic }}
                />
              ))}
            </div>
          </div>

          {/* Contact info */}
          <div className="mb-12">
            <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#060606]/95 mb-5">
              Contact
            </p>
            <div className="flex flex-col gap-5">
              {[
                { label: 'Email', value: 'care@gajrajpaithani.com' },
                { label: 'WhatsApp', value: '+91 98765 43210' },
                { label: 'Hours', value: 'Mon – Sat, 10 am – 6 pm IST' },
                { label: 'Response time', value: 'Within 1 – 2 business days' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#010101]/75 mb-1">
                    {label}
                  </p>
                  <p className="text-[13px] font-light text-[#1B1B1B]/70">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ link */}
          <div className="pt-8 border-t border-black/8">
            <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95 mb-3">
              Quick answers
            </p>
            <p className="text-[13px] text-[#1B1B1B]/50 font-light mb-4 leading-[1.75]">
              Many questions are answered in our FAQ — check there first for
              faster answers.
            </p>
            <a
              href="/faq"
              className="inline-block text-[0.725rem] tracking-[1.5px] uppercase text-white px-[1.3rem] py-[0.8rem] bg-[#1B1B1B] hover:bg-[#333] transition-colors duration-200"
            >
              Browse FAQ
            </a>
          </div>
        </div>

        {/* RIGHT — support form + case list */}
        <div className="w-full lg:w-[58%] px-6 md:px-12 lg:px-16 py-12">
          {/* Guest gate */}
          {status !== 'loading' && !isAuthenticated && <GuestHelp />}

          {/* Authenticated content */}
          {(status === 'loading' || isAuthenticated) && (
          <>{/* Tab switcher */}
          <div className="flex gap-8 border-b border-black/8 mb-10">
            {(['new', 'cases'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  setSelectedCase(null);
                  setSubmitSuccess(false);
                }}
                className={`pb-4 text-[0.725rem] tracking-[1.5px] uppercase ${tab == t ? 'text-[#1B1B1B]/95' : 'text-[#5e5e5e]'}  transition-colors duration-200 cursor-pointer border-b-[1.5px] -mb-px`}
                style={{
                  borderBottomColor: tab === t ? '#1B1B1B' : 'transparent',
                }}
              >
                {t === 'new' ? 'New Case' : 'My Cases'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* ── New Case ─────────────────────────────────────────────── */}
            {tab === 'new' && (
              <motion.div
                key="new"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="flex flex-col gap-8 max-w-lg"
              >
                {/* Success */}
                <AnimatePresence>
                  {submitSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="border border-black/8 px-6 py-5 flex items-start justify-between gap-4"
                    >
                      <p className="text-[13px] font-light text-[#1B1B1B]/65 leading-[1.75]">
                        Your case has been submitted. Our team will be in touch
                        within 1 – 2 business days.
                      </p>
                      <button
                        onClick={() => setSubmitSuccess(false)}
                        className="shrink-0 mt-0.5 cursor-pointer"
                      >
                        <X
                          size={13}
                          strokeWidth={1.5}
                          className="text-[#1B1B1B]/35 hover:text-[#1B1B1B]"
                        />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error */}
                <AnimatePresence>
                  {submitError && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="border border-black/8 px-6 py-5"
                    >
                      <p className="text-[13px] font-light text-[#1B1B1B]/65">
                        {submitError}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="flex flex-col gap-8">
                  <div className="flex flex-col gap-1">
                    <label className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/85">
                      Order ID{' '}
                      <span className="normal-case tracking-normal font-light">
                        (optional)
                      </span>
                    </label>
                    <input
                      type="text"
                      placeholder="Paste your order ID if applicable"
                      value={orderId}
                      onChange={(e) => setOrderId(e.target.value)}
                      className={fieldClass}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/85">
                      Issue Type <span className="text-[#1B1B1B]/85">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Damaged product, Wrong item, Payment…"
                      value={issueType}
                      onChange={(e) => setIssueType(e.target.value)}
                      required
                      className={fieldClass}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/85">
                      Description <span className="text-[#1B1B1B]/85">*</span>
                    </label>
                    <textarea
                      placeholder="Describe the issue in as much detail as possible…"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      rows={6}
                      className={`${fieldClass} resize-none`}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || profileLoading || !profile}
                    className="inline-block text-[0.725rem] tracking-[1.5px] uppercase text-white px-[1.3rem] py-[0.8rem] bg-[#1B1B1B] hover:bg-[#333] transition-colors duration-200"
                  >
                    {submitting ? (
                      <>
                        <Loader2
                          size={13}
                          strokeWidth={1.5}
                          className="animate-spin"
                        />{' '}
                        Submitting…
                      </>
                    ) : (
                      'Submit Case'
                    )}
                  </button>
                </form>
              </motion.div>
            )}

            {/* ── My Cases ─────────────────────────────────────────────── */}
            {tab === 'cases' && (
              <motion.div
                key="cases"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
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
                    >
                      {/* Counts */}
                      {cases.length > 0 && (
                        <div className="flex gap-8 mb-10 border-b border-black/8 pb-8">
                          {[
                            { label: 'Open', count: counts.open },
                            { label: 'In Progress', count: counts.inProgress },
                            { label: 'Resolved', count: counts.resolved },
                          ].map(({ label, count }) => (
                            <div key={label}>
                              <p className="text-[1.5rem] font-light text-[#1B1B1B]">
                                {count}
                              </p>
                              <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/85 mt-1">
                                {label}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Error */}
                      {casesError && (
                        <p className="text-[13px] font-light text-[#1B1B1B]/55">
                          {casesError}
                        </p>
                      )}

                      {/* Skeletons */}
                      {casesLoading && (
                        <div className="flex flex-col gap-3">
                          {[1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className="h-16 border-b border-black/8"
                              style={{
                                background:
                                  'linear-gradient(90deg,#f5f5f5 25%,#fafafa 50%,#f5f5f5 75%)',
                                backgroundSize: '200% 100%',
                                animation: `skeleton-shimmer 1.6s ${i * 0.1}s infinite`,
                              }}
                            />
                          ))}
                        </div>
                      )}

                      {/* Empty */}
                      {!casesLoading && cases.length === 0 && !casesError && (
                        <div className="py-16 flex flex-col gap-4">
                          <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/35">
                            No cases yet
                          </p>
                          <p className="text-[13px] font-light text-[#1B1B1B]/50 leading-[1.75]">
                            Once you submit a support request, you can track it
                            here.
                          </p>
                          <button
                            onClick={() => setTab('new')}
                            className="w-fit text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B] border-b border-[#1B1B1B]/35 pb-0.5 hover:border-[#1B1B1B] transition-colors duration-200 cursor-pointer"
                          >
                            Submit a Case
                          </button>
                        </div>
                      )}

                      {/* Case rows */}
                      {!casesLoading && cases.length > 0 && (
                        <div className="border-t border-black/8">
                          {cases.map((c) => (
                            <button
                              key={c.id}
                              onClick={() => setSelectedCase(c)}
                              className="w-full text-left border-b border-black/8 py-5 flex items-center gap-5  cursor-pointer"
                            >
                              <div
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{
                                  background: STATUS_DOT[c.status],
                                  opacity: c.status === 'RESOLVED' ? 0.9 : 0.8,
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-[13.5px] font-light text-[#1B1B1B] truncate">
                                  {c.issueType}
                                </p>
                                <p className="text-[11px] text-[#1B1B1B]/35 mt-0.5">
                                  {fmtDate(c.createdAt)}
                                </p>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/85">
                                  {STATUS_LABEL[c.status]}
                                </span>
                                <ChevronRight
                                  size={13}
                                  strokeWidth={1.5}
                                  className="text-[#1B1B1B]/75"
                                />
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
          </>)}
        </div>
      </div>

      <Footer />
    </div>
  );
}
