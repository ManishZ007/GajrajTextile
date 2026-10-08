'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

export default function MobileLogin() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [retryAt, setRetryAt] = useState(0);
  const [expiresAt, setExpiresAt] = useState(0);
  const [now, setNow] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [unregistered, setUnregistered] = useState(false);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const wait = Math.max(0, Math.ceil((retryAt - now) / 1000));
  const expired = Boolean(challengeId && now >= expiresAt);
  async function requestCode() {
    setBusy(true);
    setError('');
    setNotice('');
    setUnregistered(false);
    try {
      const res = await fetch('/api/login/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 404 || res.status === 403) {
          setChallengeId('');
          setCode('');
          setExpiresAt(0);
          setRetryAt(0);
          setUnregistered(res.status === 404);
        }
        if (res.status === 429) {
          setNow(Date.now());
          setRetryAt(Date.now() + 60000);
        }
        throw new Error(data.message || 'Unable to request a code.');
      }
      setChallengeId(data.challengeId);
      setCode('');
      setNow(Date.now());
      setRetryAt(Date.now() + data.retryAfter * 1000);
      setExpiresAt(Date.now() + data.expiresIn * 1000);
      setNotice(data.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to request a code.');
    } finally {
      setBusy(false);
    }
  }
  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!challengeId) {
      await requestCode();
      return;
    }
    setBusy(true);
    setError('');
    try {
      const result = await signIn('credentials', {
        mode: 'mobile',
        phone,
        code,
        challengeId,
        redirect: false,
      });
      if (!result || result.error)
        throw new Error(
          'Code invalid, expired, or mobile login unavailable. Try again or use email login.'
        );
      window.location.href = '/';
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to sign in.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={verify} className="flex flex-col gap-6">
      <p className="text-sm text-black/60">
        Sign in with the mobile number registered to your customer account.
      </p>
      <div>
        <label
          htmlFor="login-phone"
          className="block text-xs uppercase tracking-widest mb-2"
        >
          Mobile number
        </label>
        <div className="flex gap-3 border-b border-black/20 pb-3">
          <span className="text-sm shrink-0 whitespace-nowrap">+91</span>
          <input
            id="login-phone"
            type="tel"
            autoComplete="tel-national"
            inputMode="numeric"
            pattern="[6-9][0-9]{9}"
            maxLength={10}
            value={phone}
            required
            disabled={busy || Boolean(challengeId)}
            placeholder="10-digit mobile number"
            onChange={(e) => {
              setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
              setError('');
              setUnregistered(false);
            }}
            className="w-full min-w-0 outline-none text-sm bg-transparent"
          />
        </div>
      </div>
      {challengeId && (
        <div>
          <label
            htmlFor="login-otp"
            className="block text-xs uppercase tracking-widest mb-2"
          >
            One-time code
          </label>
          <input
            id="login-otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            minLength={6}
            maxLength={6}
            value={code}
            required
            disabled={busy || expired}
            placeholder="6-digit code"
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
            }
            className="w-full border-b border-black/20 pb-3 outline-none text-sm"
          />
        </div>
      )}
      {notice && (
        <p role="status" className="text-sm text-black/60">
          {notice}
        </p>
      )}
      {expired && (
        <p className="text-sm text-amber-800">
          This code has expired. Request a new code.
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      {unregistered && (
        <Link href="/register" className="text-sm underline">
          Create account
        </Link>
      )}
      <button
        type="submit"
        disabled={busy || expired || (!challengeId && wait > 0)}
        className="w-full bg-black rounded-full text-white text-xs tracking-widest uppercase py-4 disabled:opacity-40"
      >
        {busy
          ? 'Please wait'
          : challengeId
            ? 'Verify & sign in'
            : wait > 0
              ? `Try again in ${wait}s`
              : 'Request OTP'}
      </button>
      {challengeId && (
        <div className="flex justify-between text-sm">
          <button
            type="button"
            disabled={busy || wait > 0}
            onClick={requestCode}
            className="underline disabled:opacity-40"
          >
            {wait > 0 ? `Resend in ${wait}s` : 'Resend code'}
          </button>
          <button
            type="button"
            disabled={busy}
            className="underline"
            onClick={() => {
              setChallengeId('');
              setCode('');
              setNotice('');
              setError('');
            }}
          >
            Change number
          </button>
        </div>
      )}
    </form>
  );
}
