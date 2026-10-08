'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { LogoFont } from '@/provider/fonts';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
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
        const data = await res.json().catch(() => ({}));
        setError(data?.message ?? 'Registration failed. Please try again.');
        setLoading(false);
        return;
      }

      await signIn('credentials', { email, password, redirect: false });
      window.location.href = '/';
    } catch {
      setError('Something went wrong. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* ── Left panel — brand (desktop only) ───────────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] bg-[#1B1B1B] flex-col justify-between px-14 py-16">
        <p
          className={`${LogoFont.className} text-[13px] tracking-[4px] text-white/90 select-none`}
        >
          GAJRAJ PAITHANI
        </p>
        <div>
          <p
            className="font-light text-white leading-[1.15] tracking-[-0.02em] mb-6"
            style={{ fontSize: 'clamp(1.8rem, 3vw, 3rem)' }}
          >
            Become part
            <br />
            of a tradition
            <br />
            six centuries
            <br />
            in the making.
          </p>
          <p className="text-[13px] text-white/35 font-light leading-[1.8] max-w-xs">
            Create an account to save your favourites, track orders, and
            commission a Paithani made entirely for you.
          </p>
        </div>
        <p className="text-[0.65rem] tracking-[1.5px] uppercase text-white/20">
          Yeola · Nashik · Maharashtra
        </p>
      </div>

      {/* ── Right panel — form ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 md:px-12 py-16">
        <div className="w-full max-w-sm">
          {/* Brand — mobile only */}
          <p
            className={`${LogoFont.className} text-[12px] tracking-[4px] text-[#1B1B1B]/95 mb-10 lg:hidden select-none`}
          >
            GAJRAJ PAITHANI
          </p>

          {/* Heading */}
          <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/55 mb-3">
            New here
          </p>
          <h1
            className="font-light text-[#1B1B1B] leading-[1.1] tracking-[-0.02em] mb-10"
            style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)' }}
          >
            Create account
          </h1>

          {/* Error */}
          {error && (
            <div className="border border-red-200 bg-red-50 px-4 py-3 mb-8">
              <p className="text-[12.5px] text-red-600 font-light">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleRegister} className="flex flex-col gap-7">
            {/* Full Name */}
            <div>
              <label className="block text-[0.7rem] tracking-[1.5px] uppercase text-[#1B1B1B]/75 mb-2">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full border-b border-black/15 bg-transparent text-[13.5px] font-light text-[#1B1B1B] pb-3 pt-1 outline-none focus:border-[#1B1B1B] placeholder:text-[#1B1B1B]/25 transition-colors duration-200"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-[0.7rem] tracking-[1.5px] uppercase text-[#1B1B1B]/75 mb-2">
                Email
              </label>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border-b border-black/15 bg-transparent text-[13.5px] font-light text-[#1B1B1B] pb-3 pt-1 outline-none focus:border-[#1B1B1B] placeholder:text-[#1B1B1B]/25 transition-colors duration-200"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-[0.7rem] tracking-[1.5px] uppercase text-[#1B1B1B]/75 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="+91 00000 00000"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                className="w-full border-b border-black/15 bg-transparent text-[13.5px] font-light text-[#1B1B1B] pb-3 pt-1 outline-none focus:border-[#1B1B1B] placeholder:text-[#1B1B1B]/25 transition-colors duration-200"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-[0.7rem] tracking-[1.5px] uppercase text-[#1B1B1B]/75 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full border-b border-black/15 bg-transparent text-[13.5px] font-light text-[#1B1B1B] pb-3 pt-1 pr-8 outline-none focus:border-[#1B1B1B] placeholder:text-[#1B1B1B]/25 transition-colors duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-0 top-1 text-[#1B1B1B]/25 hover:text-[#1B1B1B]/60 transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black rounded-full text-white text-[0.725rem] tracking-[1.5px] uppercase py-4 hover:opacity-80 transition-opacity duration-200 disabled:opacity-40 cursor-pointer mt-2"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-black/8" />
            <span className="text-[0.65rem] tracking-[1.5px] uppercase text-[#1B1B1B]/45">
              or
            </span>
            <div className="flex-1 h-px bg-black/8" />
          </div>

          {/* OAuth */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => signIn('google', { callbackUrl: '/' })}
              className="w-full border border-black/10 text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/60 py-3.5 flex items-center justify-center gap-3 hover:border-black/25 hover:text-[#1B1B1B] transition-colors duration-200 cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>

            <button
              onClick={() => signIn('facebook', { callbackUrl: '/' })}
              className="w-full border border-black/10 text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/60 py-3.5 flex items-center justify-center gap-3 hover:border-black/25 hover:text-[#1B1B1B] transition-colors duration-200 cursor-pointer"
            >
              <svg
                className="w-4 h-4 shrink-0"
                viewBox="0 0 24 24"
                fill="#1877F2"
              >
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Continue with Facebook
            </button>
          </div>

          {/* Footer link */}
          <p className="text-[12px] text-[#1B1B1B]/35 font-light mt-10 text-center">
            Already have an account?{' '}
            <a
              href="/login"
              className="text-[#1B1B1B] border-b border-[#1B1B1B]/30 pb-px hover:border-[#1B1B1B] transition-colors duration-200"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
