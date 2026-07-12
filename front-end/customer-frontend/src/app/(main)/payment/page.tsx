'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, MapPin, CheckCircle2, AlertCircle, Loader2,
  Truck, Smartphone, CreditCard, Building2, Check,
} from 'lucide-react';
import { clientFetch } from '@/lib/clientFetch';
import { CartItem, CartResponse } from '@/types/cart';
import { CustomerProfile } from '@/types/customer';
import { useAddressStore } from '@/store/addressStore';
import { toCapitalCase } from '@/lib/textUtils';

// ─── Types ────────────────────────────────────────────────────────────────────

type PaymentMethod = 'COD' | 'UPI' | 'CARD' | 'NET_BANKING';

interface OrderResponse {
  orderId: string;
  orderNumber?: string;
  orderStatus?: string;
  totalAmount?: number;
}

interface RazorpayHandlerResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  handler: (r: RazorpayHandlerResponse) => void;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
}

declare global {
  interface Window {
    Razorpay: new (o: RazorpayOptions) => { open: () => void };
  }
}

// ─── Payment method config ────────────────────────────────────────────────────

const METHODS: {
  id: PaymentMethod;
  label: string;
  desc: string;
  icon: React.ElementType;
}[] = [
  { id: 'COD',         label: 'Cash on Delivery',   desc: 'Pay when your order arrives', icon: Truck      },
  { id: 'UPI',         label: 'UPI',                 desc: 'PhonePe, Google Pay, Paytm',  icon: Smartphone },
  { id: 'CARD',        label: 'Credit / Debit Card', desc: 'Visa, Mastercard, RuPay',     icon: CreditCard },
  { id: 'NET_BANKING', label: 'Net Banking',         desc: 'All major banks supported',   icon: Building2  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

// ─── Create order helper (called after payment for online, directly for COD) ─

async function createOrderForItem(
  item: CartItem,
  userId: string,
  addressId: number,
  paymentMethod: PaymentMethod,
): Promise<OrderResponse> {
  const payload: Record<string, unknown> = {
    userId,
    productId: item.product.productId,
    addressId: String(addressId),
    orderType: item.itemType ?? 'READY_MADE',
    quantity: item.quantity,
    totalAmount: item.subtotal,
    paymentMethod,
  };
  if (item.variant?.variantId) payload.variantId = item.variant.variantId;

  const r = await clientFetch('/api/order/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(`Order creation failed (${r.status})`);
  return r.json();
}

// ─── Checkout steps strip ─────────────────────────────────────────────────────

const STEPS = ['BAG', 'ADDRESS', 'PAYMENT'] as const;

function CheckoutSteps() {
  return (
    <div
      className="w-full border-b"
      style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        fontFamily: 'Switzer', fontWeight: 500,
      }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-10 h-11 flex items-center relative">
        <div className="flex items-center mx-auto">
          {STEPS.map((step, i) => {
            const isActive = i === 2;
            const isDone = i < 2;
            return (
              <div key={step} className="flex items-center">
                <div className="flex flex-col items-center">
                  <span
                    className="text-[10px] sm:text-[11px] font-semibold tracking-[2px]"
                    style={{
                      color: isActive
                        ? 'var(--color-text)'
                        : isDone
                        ? 'var(--color-text-muted)'
                        : 'var(--color-text-subtle)',
                    }}
                  >
                    {step}
                  </span>
                  {isActive && (
                    <div
                      className="h-0.5 w-full mt-0.5 rounded-full"
                      style={{ background: 'var(--color-text)' }}
                    />
                  )}
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex items-center mx-3 sm:mx-5 pb-1">
                    {Array.from({ length: 6 }).map((_, d) => (
                      <span
                        key={d}
                        className="w-1.5 h-px mx-px rounded-full"
                        style={{ background: 'var(--color-text-muted)' }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-1.5 absolute right-4 sm:right-10">
          <ShieldCheck strokeWidth={1.5} className="w-3.5 h-3.5 text-emerald-500" />
          <span
            className="hidden sm:block text-[10px] font-semibold tracking-[1.5px] uppercase"
            style={{ color: 'var(--color-text-subtle)' }}
          >
            100% Secure
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type PageState =
  | 'idle'
  | 'creating_order'       // COD: placing order
  | 'initiating_payment'   // Online: calling payment service
  | 'paying'               // Online: Razorpay popup open (silent state — rzp handles UI)
  | 'verifying'            // Online: verifying signature
  | 'placing_order'        // Online: creating order after payment success
  | 'success'
  | 'failed';

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addressId = Number(searchParams.get('addressId'));

  const addresses = useAddressStore((s) => s.addresses);
  const selectedAddress = addresses.find((a) => a.id === addressId);

  const [cart, setCart] = useState<CartResponse | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageState, setPageState] = useState<PageState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod>('COD');
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!addressId) { router.replace('/checkout'); return; }
    Promise.all([
      clientFetch('/api/cart').then((r) => r.json()).catch(() => null),
      clientFetch('/api/customer/profile').then((r) => r.json()).catch(() => null),
    ]).then(([cartData, profileData]) => {
      if (!cartData?.items?.length) { router.replace('/cart'); return; }
      setCart(cartData);
      setProfile(profileData);
    }).finally(() => setLoading(false));
  }, [addressId, router]);

  useEffect(() => {
    if (!loading && addressId && addresses.length > 0 && !selectedAddress) {
      router.replace('/checkout');
    }
  }, [loading, addresses, selectedAddress, addressId, router]);

  // ── COD flow ───────────────────────────────────────────────────────────────
  // Create order directly — no payment involved.

  const handleCOD = async () => {
    if (!cart || !profile) return;
    setErrorMsg(null);
    setPageState('creating_order');

    const userId = profile.authentication.auth.userId;
    try {
      const responses = await Promise.all(
        cart.items.map((item) => createOrderForItem(item, userId, addressId, 'COD'))
      );
      setSuccessOrderId(responses[0]?.orderId ?? null);
      setPageState('success');
    } catch {
      setErrorMsg('Failed to place order. Please try again.');
      setPageState('failed');
    }
  };

  // ── Online payment flow ────────────────────────────────────────────────────
  // 1. Ask payment service to create a Razorpay order (no backend order yet)
  // 2. Open Razorpay popup → customer pays
  // 3. Verify signature with payment service
  // 4. Only on success → create order(s) in order service

  const handleOnlinePayment = async () => {
    if (!cart || !profile) return;
    setErrorMsg(null);

    const auth = profile.authentication?.auth;
    const userId = auth?.userId ?? '';

    // Step 1 — Create Razorpay order via payment service
    setPageState('initiating_payment');
    let razorpayOrderId: string;
    let keyId: string;
    let razorpayAmount: number;
    try {
      const r = await clientFetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: cart.estimatedTotal,   // rupees — backend converts to paise
          paymentMethod: method,
          receipt: `gajraj_${Date.now()}`,
        }),
      });
      if (!r.ok) throw new Error('Payment service error');
      const data = await r.json();
      razorpayOrderId = data.razorpayOrderId;
      keyId = data.keyId;
      razorpayAmount = data.amount;      // already in paise from payment service
    } catch {
      setErrorMsg('Could not initiate payment. Please try again.');
      setPageState('failed');
      return;
    }

    // Step 2 — Open Razorpay checkout
    setPageState('paying');
    const rzp = new window.Razorpay({
      key: keyId,
      amount: razorpayAmount,
      currency: 'INR',
      order_id: razorpayOrderId,
      name: 'Gajraj Paithani',
      description: 'Handwoven Paithani Saree',
      prefill: {
        name: auth?.fullName ?? '',
        email: auth?.email ?? '',
        contact: auth?.phoneNumber ?? '',
      },
      theme: { color: '#1B1B1B' },
      modal: {
        // Customer dismissed — no order was created, nothing to clean up
        ondismiss: () => {
          setErrorMsg('Payment was cancelled. No order was placed.');
          setPageState('idle');
        },
      },
      handler: async (response: RazorpayHandlerResponse) => {
        // Step 3 — Verify payment signature
        setPageState('verifying');
        try {
          const vr = await clientFetch('/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          });
          const result = await vr.json();
          if (result.message !== 'Payment successful') throw new Error('Verification failed');
        } catch {
          setErrorMsg('Payment verification failed. Contact support if amount was deducted.');
          setPageState('failed');
          return;
        }

        // Step 4 — Payment verified → now create orders
        setPageState('placing_order');
        try {
          const responses = await Promise.all(
            cart.items.map((item) => createOrderForItem(item, userId, addressId, method))
          );
          setSuccessOrderId(responses[0]?.orderId ?? null);
          setPageState('success');
        } catch {
          // Payment succeeded but order creation failed — show support message
          setErrorMsg(
            'Payment was successful but order placement failed. Please contact support with your payment ID.'
          );
          setPageState('failed');
        }
      },
    });

    rzp.open();
  };

  const handlePlaceOrder = () => {
    if (isProcessing) return;
    if (method === 'COD') handleCOD();
    else handleOnlinePayment();
  };

  const isProcessing =
    pageState === 'creating_order' ||
    pageState === 'initiating_payment' ||
    pageState === 'paying' ||
    pageState === 'verifying' ||
    pageState === 'placing_order';

  const statusLabel: Partial<Record<PageState, string>> = {
    creating_order: 'Placing order…',
    initiating_payment: 'Initiating payment…',
    paying: 'Waiting for payment…',
    verifying: 'Verifying payment…',
    placing_order: 'Confirming order…',
  };

  const totalQty = cart?.items?.reduce((s, i) => s + i.quantity, 0) ?? 0;

  // ── Success screen ──────────────────────────────────────────────────────────

  if (pageState === 'success') {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4 px-4"
        style={{ background: 'var(--color-bg)' }}
      >
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          <CheckCircle2 strokeWidth={1.2} className="w-20 h-20 text-emerald-500" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center flex flex-col gap-2"
        >
          <h1 className="text-[22px] font-light" style={{ color: 'var(--color-text)' }}>
            {method === 'COD' ? 'Order Placed!' : 'Payment Successful'}
          </h1>
          <p className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>
            {method === 'COD'
              ? 'Your order is confirmed. Pay when it arrives.'
              : 'Your payment is verified and order has been placed.'}
          </p>
        </motion.div>
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push(successOrderId ? `/orders/${successOrderId}` : '/orders')}
          className="mt-2 px-8 py-3 rounded-2xl text-[13px] font-medium cursor-pointer transition duration-200 hover:opacity-80"
          style={{ background: 'var(--color-accent)', color: 'var(--color-accent-text)' }}
        >
          View My Orders
        </motion.button>
      </div>
    );
  }

  // ── Main page ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <CheckoutSteps />

      {loading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2
            strokeWidth={1.5}
            className="w-6 h-6 animate-spin"
            style={{ color: 'var(--color-text-subtle)' }}
          />
        </div>
      ) : (
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-8 flex flex-col gap-4">

          {/* Error / cancel banner */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl p-4 flex items-start gap-3"
                style={{ background: '#FEF9C3', border: '1px solid #CA8A04' }}
              >
                <AlertCircle strokeWidth={1.8} className="w-4 h-4 shrink-0 mt-0.5 text-yellow-600" />
                <p className="text-[12.5px]" style={{ color: '#78350F' }}>{errorMsg}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Delivery address */}
          {selectedAddress && (
            <div
              className="rounded-2xl p-4 border flex items-start gap-3"
              style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'var(--color-surface-muted)' }}
              >
                <MapPin strokeWidth={1.5} className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
              </div>
              <div>
                <p
                  className="text-[10px] font-semibold uppercase tracking-widest mb-1"
                  style={{ color: 'var(--color-text-subtle)' }}
                >
                  Delivering to
                </p>
                <p className="text-[13px] font-medium" style={{ color: 'var(--color-text)' }}>
                  {selectedAddress.label} — {selectedAddress.street}
                </p>
                <p className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
                  {toCapitalCase(selectedAddress.city)},{' '}
                  <span style={{ fontFamily: 'Switzer', fontWeight: 500 }}>{selectedAddress.postalCode}</span>
                </p>
              </div>
            </div>
          )}

          {/* Payment method selector */}
          <div
            className="rounded-2xl p-5 border"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <p
              className="text-[10px] font-semibold uppercase tracking-widest mb-4"
              style={{ color: 'var(--color-text-subtle)' }}
            >
              Payment Method
            </p>
            <div className="flex flex-col gap-2.5">
              {METHODS.map(({ id, label, desc, icon: Icon }) => {
                const isSelected = method === id;
                return (
                  <button
                    key={id}
                    onClick={() => { setMethod(id); setErrorMsg(null); }}
                    disabled={isProcessing}
                    className="flex items-center gap-3 p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      borderColor: isSelected ? 'var(--color-text)' : 'var(--color-border)',
                      borderWidth: isSelected ? '1.5px' : '1px',
                      background: isSelected ? 'rgba(10,10,10,0.03)' : 'transparent',
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        background: isSelected ? 'var(--color-text)' : 'var(--color-surface-muted)',
                      }}
                    >
                      <Icon
                        strokeWidth={1.5}
                        className="w-4 h-4"
                        style={{
                          color: isSelected ? 'var(--color-accent-text)' : 'var(--color-text-muted)',
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium" style={{ color: 'var(--color-text)' }}>
                        {label}
                      </p>
                      <p className="text-[11px]" style={{ color: 'var(--color-text-subtle)' }}>
                        {desc}
                      </p>
                    </div>
                    <div
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-150"
                      style={{
                        borderColor: isSelected ? 'var(--color-text)' : 'var(--color-border-strong)',
                        background: isSelected ? 'var(--color-text)' : 'transparent',
                      }}
                    >
                      {isSelected && (
                        <Check
                          strokeWidth={2.5}
                          className="w-2.5 h-2.5"
                          style={{ color: 'var(--color-accent-text)' }}
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Order summary */}
          <div
            className="rounded-2xl p-5 border"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <p
              className="text-[10px] font-semibold uppercase tracking-widest mb-4"
              style={{ color: 'var(--color-text-subtle)' }}
            >
              Order Summary
            </p>
            <div className="flex flex-col gap-3 mb-4">
              {cart?.items?.map((item) => (
                <div key={item.cartItemId} className="flex items-center gap-3">
                  <div
                    className="w-10 h-12 rounded-lg overflow-hidden shrink-0"
                    style={{ background: '#F3EEE9' }}
                  >
                    {item.primaryImageUrl && (
                      <img
                        src={item.primaryImageUrl}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] truncate" style={{ color: 'var(--color-text)' }}>
                      {item.product.name}
                    </p>
                    <p
                      className="text-[11px]"
                      style={{ color: 'var(--color-text-subtle)', fontFamily: 'Switzer', fontWeight: 500 }}
                    >
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <span
                    className="text-[13px] font-medium shrink-0"
                    style={{ color: 'var(--color-text)', fontFamily: 'Switzer', fontWeight: 500 }}
                  >
                    {formatINR(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>
            <div className="h-px mb-4" style={{ background: 'var(--color-border)' }} />
            <div className="flex flex-col gap-2.5">
              <div
                className="flex justify-between text-[12.5px]"
                style={{ color: 'var(--color-text-muted)', fontFamily: 'Switzer', fontWeight: 500 }}
              >
                <span>Subtotal ({totalQty} {totalQty === 1 ? 'item' : 'items'})</span>
                <span>{formatINR(cart?.subtotal ?? 0)}</span>
              </div>
              <div
                className="flex justify-between text-[12.5px]"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <span>Delivery</span>
                <span className="text-emerald-600 font-medium">FREE</span>
              </div>
              <div className="h-px my-1" style={{ background: 'var(--color-border)' }} />
              <div
                className="flex justify-between text-[15px] font-bold"
                style={{ color: 'var(--color-text)' }}
              >
                <span>Total</span>
                <span style={{ fontFamily: 'Switzer', fontWeight: 500 }}>
                  {formatINR(cart?.estimatedTotal ?? 0)}
                </span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handlePlaceOrder}
            disabled={isProcessing}
            className="w-full py-4 rounded-2xl text-[14px] font-semibold flex items-center justify-center gap-2.5 cursor-pointer transition duration-200 hover:opacity-80 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: 'var(--color-accent)', color: 'var(--color-accent-text)' }}
          >
            {isProcessing ? (
              <>
                <Loader2 strokeWidth={2} className="w-4 h-4 animate-spin" />
                {statusLabel[pageState] ?? 'Processing…'}
              </>
            ) : method === 'COD' ? (
              'Place Order'
            ) : (
              <>
                Pay{' '}
                <span style={{ fontFamily: 'Switzer', fontWeight: 500 }}>
                  {formatINR(cart?.estimatedTotal ?? 0)}
                </span>
              </>
            )}
          </motion.button>

          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-1.5">
              <ShieldCheck strokeWidth={1.5} className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[11px]" style={{ color: 'var(--color-text-subtle)' }}>
                Secured by Razorpay
              </span>
            </div>
            <span style={{ color: 'var(--color-border-strong)' }}>·</span>
            <span className="text-[11px]" style={{ color: 'var(--color-text-subtle)' }}>
              256-bit SSL
            </span>
          </div>

        </div>
      )}
    </div>
  );
}
