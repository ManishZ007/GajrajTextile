'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import LandingNavbar from '@/components/Navbar/LandingNavbar';
import Footer from '@/components/Footer/Footer';
import {
  CONTACT_INFO,
  TOPICS,
} from '@/constants/singlePageConstants/contactPageConstant';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    setSubmitting(true);
    // Simulate a short delay (replace with real API call if needed)
    await new Promise((r) => setTimeout(r, 900));
    setSubmitted(true);
    setSubmitting(false);
  };

  const reset = () => {
    setName('');
    setEmail('');
    setTopic('');
    setMessage('');
    setSubmitted(false);
  };

  const fieldClass =
    'w-full border-b border-black/12 bg-transparent text-[13.5px] font-light text-[#1B1B1B] placeholder:text-[#1B1B1B]/25 py-3 outline-none focus:border-[#1B1B1B]/40 transition-colors duration-200';

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* â”€â”€ Navbar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <LandingNavbar backgroundBlurEffect={true} blackColor={true} />

      {/* â”€â”€ Content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="pt-15 md:pt-18 flex-1 flex flex-col">
        {/* â”€â”€ Hero â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section className="px-6 md:px-12 lg:px-16 pt-14 pb-12 border-b border-black/8">
          <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95 mb-5">
            Support
          </p>
          <h1
            className="font-light text-[#1B1B1B] leading-[1.08] tracking-[-0.02em]"
            style={{ fontSize: 'clamp(2rem, 5vw, 4rem)' }}
          >
            Get in Touch
          </h1>
          <p className="mt-5 text-[13px] text-[#1B1B1B]/55 max-w-md leading-[1.75] font-light">
            Have a question or need assistance? Fill in the form and our
            customer care team will respond within 1 â€“ 2 business days.
          </p>
        </section>

        {/* â”€â”€ Two-column body â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="flex-1 flex flex-col lg:flex-row">
          {/* LEFT â€” contact info â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="w-full lg:w-[42%] lg:border-r border-black/8 px-6 md:px-12 lg:px-16 py-12">
            {/* Contact details */}
            <div className="mb-12">
              <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95 mb-5">
                Contact Details
              </p>
              <div className="border-t border-black/8">
                {CONTACT_INFO.map(({ label, value, detail }) => (
                  <div key={label} className="border-b border-black/8 py-5">
                    <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95 mb-1.5">
                      {label}
                    </p>
                    <p className="text-[13.5px] font-light text-[#1B1B1B] mb-0.5">
                      {value}
                    </p>
                    <p className="text-[12px] font-light text-[#1B1B1B]/40">
                      {detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Hours */}
            <div className="mb-12">
              <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95 mb-5">
                Business Hours
              </p>
              <div className="flex flex-col gap-3">
                {[
                  { day: 'Monday â€“ Saturday', time: '10:00 am â€“ 6:00 pm IST' },
                  { day: 'Sunday', time: 'Closed' },
                ].map(({ day, time }) => (
                  <div
                    key={day}
                    className="flex items-start justify-between gap-4"
                  >
                    <p className="text-[13px] font-light text-[#1B1B1B]/65">
                      {day}
                    </p>
                    <p className="text-[13px] font-light text-[#1B1B1B] shrink-0">
                      {time}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ link */}
            <div className="pt-8 border-t border-black/8">
              <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95 mb-3">
                Quick Answers
              </p>
              <p className="text-[13px] text-[#1B1B1B]/60 font-light mb-4 leading-[1.75]">
                Many questions are already answered in our FAQ â€” browse there
                first for a faster response.
              </p>
              <a
                href="/faq"
                className="inline-block text-[0.725rem] tracking-[1.5px] uppercase text-black px-8 py-3 border border-black rounded-full hover:opacity-60 transition-opacity duration-200"
              >
                Browse FAQ
              </a>
            </div>
          </div>

          {/* RIGHT â€” contact form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="w-full lg:w-[58%] px-6 md:px-12 lg:px-16 py-12">
            <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95 mb-10">
              Send Us a Message
            </p>

            {submitted ? (
              /* Success state */
              <div className="flex flex-col gap-6 max-w-lg">
                <div className="border border-black/8 px-6 py-7 flex flex-col gap-4">
                  <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95">
                    Message Sent
                  </p>
                  <p className="text-[13px] font-light text-[#1B1B1B]/70 leading-[1.8]">
                    Thank you for reaching out. Our customer care team will get
                    back to you within 1 â€“ 2 business days.
                  </p>
                </div>
                <button
                  onClick={reset}
                  className="px-8 py-3 text-[0.725rem] tracking-[1.5px] uppercase text-white bg-black rounded-full hover:opacity-80 transition-opacity duration-200 cursor-pointer"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              /* Form */
              <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-8 max-w-lg"
              >
                {/* Name */}
                <div className="flex flex-col gap-1">
                  <label className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95">
                    Full Name <span className="text-[#1B1B1B]/40">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className={fieldClass}
                  />
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1">
                  <label className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95">
                    Email Address <span className="text-[#1B1B1B]/40">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={fieldClass}
                  />
                </div>

                {/* Topic */}
                <div className="flex flex-col gap-3">
                  <label className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95">
                    Topic
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TOPICS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() =>
                          setTopic((prev) => (prev === t ? '' : t))
                        }
                        className="text-[0.725rem] tracking-[1px] uppercase px-3 py-1.5 border transition-colors duration-150 cursor-pointer"
                        style={{
                          borderColor:
                            topic === t ? '#1B1B1B' : 'rgba(27,27,27,0.1)',
                          color: topic === t ? '#1B1B1B' : 'rgba(27,27,27,0.4)',
                          background:
                            topic === t ? 'rgba(27,27,27,0.04)' : 'transparent',
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div className="flex flex-col gap-1">
                  <label className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95">
                    Message <span className="text-[#1B1B1B]/40">*</span>
                  </label>
                  <textarea
                    placeholder="Describe how we can help youâ€¦"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={5}
                    className={`${fieldClass} resize-none`}
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 text-[0.725rem] tracking-[1.5px] uppercase text-white bg-black rounded-full hover:opacity-80 transition-opacity duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2
                        size={13}
                        strokeWidth={1.5}
                        className="animate-spin"
                      />{' '}
                      Sendingâ€¦
                    </>
                  ) : (
                    'Send Message'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* â”€â”€ Footer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Footer />
    </div>
  );
}

