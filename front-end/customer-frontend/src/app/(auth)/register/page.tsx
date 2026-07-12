'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { LogoFont } from '@/provider/fonts';
import { Mail, Lock, Eye, EyeOff, User, Phone } from 'lucide-react';

export default function Register() {
  const [fullName, setFullName]         = useState('');
  const [email, setEmail]               = useState('');
  const [phoneNumber, setPhoneNumber]   = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('http://localhost:8081/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName,
        email,
        phoneNumber,
        passwordHash: password,
        role: 'CUSTOMER',
      }),
    });

    if (!res.ok) {
      const msg = await res.text();
      setError(msg || 'Registration failed. Please try again.');
      setLoading(false);
      return;
    }

    // auto sign in after successful registration
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError('Registered but could not sign in. Please login manually.');
    } else {
      window.location.href = '/';
    }

    setLoading(false);
  };

  // ── Shared style objects ──────────────────────────────────────────────────

  const cardStyle: React.CSSProperties = {
    background:           'var(--color-glass)',
    backdropFilter:       'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border:               '1px solid var(--color-glass-border)',
    boxShadow:            '0 8px 40px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.08)',
  };

  const inputStyle: React.CSSProperties = {
    background:           'var(--color-glass)',
    backdropFilter:       'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    color:                'var(--color-text)',
    border:               '1px solid var(--color-glass-border)',
    boxShadow:            '0 4px 24px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.08)',
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ background: 'var(--color-bg)' }}
    >
      {/* Brand */}
      <h1
        className={`${LogoFont.className} text-[15px] tracking-[4px] mb-8 select-none`}
        style={{ color: 'var(--color-text)' }}
      >
        GAJRAJ PAITHANI
      </h1>

      {/* Card */}
      <div className="w-full max-w-sm rounded-3xl px-8 py-10" style={cardStyle}>

        <h2 className="text-2xl font-semibold mb-1" style={{ color: 'var(--color-text)' }}>
          Create account
        </h2>
        <p className="text-sm mb-7" style={{ color: 'var(--color-text-subtle)' }}>
          Join Gajraj Paithani
        </p>

        {/* Error */}
        {error && (
          <p
            className="text-sm rounded-2xl px-4 py-3 mb-5 text-red-500"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}
          >
            {error}
          </p>
        )}

        {/* Register form */}
        <form onSubmit={handleRegister} className="flex flex-col gap-4">

          {/* Full Name */}
          <div className="relative">
            <User
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: 'var(--color-text-subtle)' }}
            />
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full h-12 rounded-full pl-11 pr-5 text-sm outline-none placeholder:text-[var(--color-text-subtle)]"
              style={inputStyle}
            />
          </div>

          {/* Email */}
          <div className="relative">
            <Mail
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: 'var(--color-text-subtle)' }}
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-12 rounded-full pl-11 pr-5 text-sm outline-none placeholder:text-[var(--color-text-subtle)]"
              style={inputStyle}
            />
          </div>

          {/* Phone Number */}
          <div className="relative">
            <Phone
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: 'var(--color-text-subtle)' }}
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              className="w-full h-12 rounded-full pl-11 pr-5 text-sm outline-none placeholder:text-[var(--color-text-subtle)]"
              style={inputStyle}
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: 'var(--color-text-subtle)' }}
            />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full h-12 rounded-full pl-11 pr-11 text-sm outline-none placeholder:text-[var(--color-text-subtle)]"
              style={inputStyle}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors cursor-pointer"
              style={{ color: 'var(--color-text-subtle)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-text)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-subtle)'; }}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-full text-sm font-medium transition-all duration-200 disabled:opacity-50 cursor-pointer hover:opacity-80"
            style={{ background: 'var(--color-accent)', color: 'var(--color-accent-text)' }}
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
          <span className="text-xs tracking-wide" style={{ color: 'var(--color-text-subtle)' }}>
            or continue with
          </span>
          <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
        </div>

        {/* OAuth buttons */}
        <div className="flex flex-col gap-3">

          {/* Google */}
          <button
            onClick={() => signIn('google', { callbackUrl: '/' })}
            className="w-full h-12 rounded-full flex items-center justify-center gap-3 text-sm font-medium transition-all duration-200 cursor-pointer hover:opacity-80"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-muted)',
            }}
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          {/* Facebook */}
          <button
            onClick={() => signIn('facebook', { callbackUrl: '/' })}
            className="w-full h-12 rounded-full flex items-center justify-center gap-3 text-sm font-medium text-white transition-all duration-200 cursor-pointer hover:opacity-80"
            style={{ background: '#1877F2', boxShadow: '0 2px 8px rgba(24,119,242,0.3)' }}
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="white">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Continue with Facebook
          </button>
        </div>

        {/* Sign in link */}
        <p className="text-center text-xs mt-7" style={{ color: 'var(--color-text-subtle)' }}>
          Already have an account?{' '}
          <a
            href="/login"
            className="font-medium transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-text)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)'; }}
          >
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
