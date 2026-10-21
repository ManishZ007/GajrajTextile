'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, Minus, Plus } from 'lucide-react';
import type { Address } from '@/types/customer';

const labelText = 'block text-[0.7rem] tracking-[1.5px] uppercase text-[#1B1B1B]/75 mb-2';

export default function RemakeRequest({ productId, variantId }: { productId: string; variantId: string }) {
  const router = useRouter();
  const requestId = useRef<string | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState('');
  const [percent, setPercent] = useState(40);
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/customer/profile').then(async response => {
      if (!response.ok) throw new Error('Sign in and add a delivery address in your profile first.');
      const data = await response.json();
      setAddresses(data.customer.addresses);
    }).catch(e => setError(e.message));
  }, []);

  return (
    <form
      className="border-t border-black/8 pt-6 flex flex-col gap-6"
      onSubmit={async e => {
        e.preventDefault(); setBusy(true); setError(''); requestId.current ??= crypto.randomUUID();
        try {
          const response = await fetch('/api/reservations/out-of-stock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestId: requestId.current, addressId, depositPercent: percent, items: [{ productId, variantId, quantity }] }) });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error ?? 'Could not request a remake');
          router.push('/reservations/out-of-stock/' + data.reservation.id);
        } catch (e) { setError(e instanceof Error ? e.message : 'Please retry'); }
        finally { setBusy(false); }
      }}
    >
      <div className="flex flex-col gap-3">
        <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/75">Made for you</p>
        <p className="font-light text-[#1B1B1B] leading-[1.2]" style={{ fontSize: 'clamp(1.1rem, 1.8vw, 1.35rem)' }}>
          This piece is sold out. We can weave it for you.
        </p>
        <p className="text-[13px] font-light text-[#1B1B1B]/60 leading-[1.8]">
          Our manager will call to confirm and share a payment QR on WhatsApp. Weaving begins once your 40% or 50% deposit is verified, and the balance can be paid in instalments before dispatch.
        </p>
      </div>

      {error && <div role="alert" className="border border-red-200 bg-red-50 px-4 py-3"><p className="text-[12.5px] text-red-600 font-light">{error}</p></div>}

      <label className="block">
        <span className={labelText}>Delivery address</span>
        <span className="relative block">
          <select required className="select-luxe w-full appearance-none border-b border-black/15 bg-transparent text-[13.5px] font-light text-[#1B1B1B] pb-3 pt-1 pr-6 outline-none focus:border-[#1B1B1B] transition-colors duration-200 cursor-pointer" value={addressId} onChange={e => setAddressId(e.target.value)}>
            <option value="">Select your address</option>
            {addresses.map(a => <option key={a.id} value={a.id}>{a.street}, {a.city}, {a.postalCode}</option>)}
          </select>
          <ChevronDown size={13} strokeWidth={1.5} className="absolute right-0 top-2 pointer-events-none text-[#1B1B1B]/45" />
        </span>
        {!addresses.length && <Link href="/profile" className="inline-block mt-3 text-[0.65rem] tracking-[1.5px] uppercase text-[#1B1B1B]/55 border-b border-[#1B1B1B]/20 pb-px hover:text-[#1B1B1B] hover:border-[#1B1B1B]/55 transition-colors">Add an address / sign in</Link>}
      </label>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <span className={labelText}>Quantity</span>
          <div className="flex items-center gap-4 pt-1">
            <button type="button" aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-8 h-8 rounded-full border border-black/15 flex items-center justify-center text-[#1B1B1B]/70 hover:border-black/50 disabled:opacity-30 cursor-pointer"><Minus size={12} strokeWidth={1.5} /></button>
            <span className="text-[14px] font-light text-[#1B1B1B] w-5 text-center" aria-live="polite">{quantity}</span>
            <button type="button" aria-label="Increase quantity" disabled={quantity >= 100} onClick={() => setQuantity(q => Math.min(100, q + 1))} className="w-8 h-8 rounded-full border border-black/15 flex items-center justify-center text-[#1B1B1B]/70 hover:border-black/50 disabled:opacity-30 cursor-pointer"><Plus size={12} strokeWidth={1.5} /></button>
          </div>
        </div>
        <div>
          <span className={labelText}>Initial deposit</span>
          <div className="flex gap-2 pt-1" role="radiogroup" aria-label="Initial deposit">
            {[40, 50].map(p => (
              <button key={p} type="button" role="radio" aria-checked={percent === p} onClick={() => setPercent(p)}
                className={`flex-1 rounded-full border px-4 py-2 text-[12px] transition-colors cursor-pointer ${percent === p ? 'bg-black text-white border-black' : 'border-black/15 text-[#1B1B1B]/60 hover:border-black/40'}`}>
                {p}%
              </button>
            ))}
          </div>
        </div>
      </div>

      <button className="w-full bg-black rounded-full text-white text-[0.725rem] tracking-[1.5px] uppercase py-4 hover:opacity-80 transition-opacity duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer" disabled={busy || !addressId}>
        {busy ? 'Sending request…' : 'Request this piece'}
      </button>
    </form>
  );
}
