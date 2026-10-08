'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { LogoFont } from '@/provider/fonts';

export default function PasswordReset({ mode }: { mode: 'request' | 'reset' }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verified, setVerified] = useState(false);
  const [checking, setChecking] = useState(mode === 'reset');
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!wait) return;
    const timer = setTimeout(() => setWait(wait - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  useEffect(() => {
    if (mode !== 'reset') return;
    const controller = new AbortController();
    const value = new URLSearchParams(window.location.hash.slice(1)).get('token') || '';
    setToken(value);
    async function validate() {
      try {
        const res = await fetch('/api/password-reset/validate', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: value }), signal: controller.signal, cache: 'no-store',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'This reset link is invalid or expired.');
        if (!controller.signal.aborted) setVerified(true);
      } catch (e) {
        if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Unable to verify the link.');
      } finally { if (!controller.signal.aborted) setChecking(false); }
    }
    void validate();
    return () => controller.abort();
  }, [mode]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setNotice('');
    if (mode === 'reset') {
      if (!verified) return;
      if (password !== confirm) { setError('Passwords do not match.'); return; }
      if (password.length < 8 || new TextEncoder().encode(password).length > 72) {
        setError('Use at least 8 characters and at most 72 UTF-8 bytes.'); return;
      }
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/password-reset/${mode}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'request' ? { email } : { token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) setWait(60);
        if (mode === 'reset' && res.status === 400) setVerified(false);
        throw new Error(data.message || 'Unable to complete your request.');
      }
      if (mode === 'reset') {
        setVerified(false); setPassword(''); setConfirm('');
        router.replace('/login?passwordReset=success');
      } else { setNotice(data.message); setWait(60); }
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to connect. Please try again.'); }
    finally { setBusy(false); }
  }

  const isRequest = mode === 'request';
  const labelClass = 'block text-[0.7rem] tracking-[1.5px] uppercase text-[#1B1B1B]/75 mb-2';
  const inputClass =
    'w-full border-b border-black/15 bg-transparent text-[13.5px] font-light text-[#1B1B1B] pb-3 pt-1 outline-none focus:border-[#1B1B1B] placeholder:text-[#1B1B1B]/25 transition-colors duration-200 disabled:opacity-50';

  const subtitle = isRequest
    ? 'Enter your registered email and we will send you a link to reset your password.'
    : checking
      ? 'Checking your reset link…'
      : verified
        ? 'Your link is verified. Enter and confirm your new password.'
        : 'This link has expired or was already used. Request a new one below.';

  return (
    <div className="min-h-screen bg-white flex">
      {/* ── Left panel — brand (desktop only) ───────────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] bg-[#1B1B1B] flex-col justify-between px-14 py-16">
        <Link href="/" className="flex items-center gap-3 w-fit select-none">
          <Image
            src="/images/logo-mark.PNG"
            alt="Gajraj Paithani"
            width={36}
            height={36}
            className="invert"
          />
          <span className={`${LogoFont.className} text-[13px] tracking-[4px] text-white/90`}>
            GAJRAJ PAITHANI
          </span>
        </Link>
        <div>
          <p
            className="font-light text-white leading-[1.15] tracking-[-0.02em] mb-6"
            style={{ fontSize: 'clamp(1.8rem, 3vw, 3rem)' }}
          >
            {isRequest ? (
              <>A forgotten thread<br />is easily rewoven.</>
            ) : (
              <>A fresh start,<br />woven securely.</>
            )}
          </p>
          <p className="text-[13px] text-white/35 font-light leading-[1.8] max-w-xs">
            Your account keeps your orders, wishlist and custom designs safe.
            Reset links are single-use and expire shortly after they are sent.
          </p>
        </div>
        <p className="text-[0.65rem] tracking-[1.5px] uppercase text-white/55">
          Yeola · Nashik · Maharashtra
        </p>
      </div>

      {/* ── Right panel — form ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 md:px-12 py-16">
        <div className="w-full max-w-sm">
          {/* Brand — mobile only */}
          <Link href="/" className="flex items-center gap-3 mb-10 lg:hidden w-fit select-none">
            <Image src="/images/logo-mark.PNG" alt="Gajraj Paithani" width={32} height={32} />
            <span className={`${LogoFont.className} text-[12px] tracking-[4px] text-[#1B1B1B]/95`}>
              GAJRAJ PAITHANI
            </span>
          </Link>

          {/* Heading */}
          <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95 mb-3">
            Your account
          </p>
          <h1
            className="font-light text-[#1B1B1B] leading-[1.1] tracking-[-0.02em] mb-4"
            style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)' }}
          >
            {isRequest ? 'Forgot password' : 'New password'}
          </h1>
          <p className="text-[13px] font-light text-[#1B1B1B]/55 leading-[1.8] mb-10 flex items-center gap-2">
            {checking && <Loader2 size={13} strokeWidth={1.5} className="animate-spin shrink-0" />}
            {subtitle}
          </p>

          {/* Error */}
          {error && (
            <div role="alert" className="border border-red-200 bg-red-50 px-4 py-3 mb-8">
              <p className="text-[12.5px] text-red-600 font-light">{error}</p>
            </div>
          )}

          {/* Notice */}
          {notice && (
            <div role="status" className="border border-black/10 px-4 py-3 mb-8">
              <p className="text-[12.5px] text-[#1B1B1B]/75 font-light leading-[1.7]">{notice}</p>
            </div>
          )}

          {/* Form */}
          {(isRequest || verified) && (
            <form onSubmit={submit} className="flex flex-col gap-7">
              {isRequest ? (
                <div>
                  <label htmlFor="reset-email" className={labelClass}>Email</label>
                  <input
                    id="reset-email" type="email" autoComplete="email" required maxLength={150}
                    disabled={busy} placeholder="your@email.com"
                    value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass}
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label htmlFor="new-password" className={labelClass}>New password</label>
                    <div className="relative">
                      <input
                        id="new-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password"
                        required minLength={8} maxLength={72} disabled={busy} placeholder="••••••••"
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        className={`${inputClass} pr-8`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-0 top-1 text-[#1B1B1B]/25 hover:text-[#1B1B1B]/60 transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="confirm-password" className={labelClass}>Confirm password</label>
                    <input
                      id="confirm-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password"
                      required minLength={8} maxLength={72} disabled={busy} placeholder="••••••••"
                      value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass}
                    />
                    <p className="text-[11.5px] font-light text-[#1B1B1B]/40 mt-2.5">
                      Use at least 8 characters.
                    </p>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={busy || (isRequest && wait > 0)}
                className="w-full bg-black rounded-full text-white text-[0.725rem] tracking-[1.5px] uppercase py-4 hover:opacity-80 transition-opacity duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer mt-2"
              >
                {busy
                  ? 'Please wait…'
                  : !isRequest
                    ? 'Update password'
                    : wait > 0
                      ? `Send again in ${wait}s`
                      : 'Send reset link'}
              </button>
            </form>
          )}

          {/* Invalid / expired link */}
          {!isRequest && !checking && !verified && (
            <Link
              href="/forgot-password"
              className="block w-full text-center bg-black rounded-full text-white text-[0.725rem] tracking-[1.5px] uppercase py-4 hover:opacity-80 transition-opacity duration-200"
            >
              Request a new link
            </Link>
          )}

          {/* Back to sign in */}
          <div className="border-t border-black/8 mt-10 pt-8 flex justify-center">
            <Link
              href="/login"
              className="flex items-center gap-1.5 text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/65 hover:text-[#1B1B1B]/95 transition-colors duration-200"
            >
              <ArrowLeft size={11} strokeWidth={1.5} />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
