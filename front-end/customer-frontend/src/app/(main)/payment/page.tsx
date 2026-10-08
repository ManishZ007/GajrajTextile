'use client';

import { useEffect, useRef, useState } from 'react';
import { loadBanks, netbankingPayload, netbankingError, type NetbankingClient } from '@/lib/netbanking';
import { upiPayload, supportedUpiApps } from '@/lib/upi';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Truck,
  CreditCard,
  Building2,
  QrCode,
  Check,
  ArrowLeft,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { clientFetch } from '@/lib/clientFetch';
import { CartItem, CartResponse } from '@/types/cart';
import { CustomerProfile } from '@/types/customer';
import { useAddressStore } from '@/store/addressStore';
import { useCartStore } from '@/store/cartStore';
import { toCapitalCase } from '@/lib/textUtils';

// ─── Types ────────────────────────────────────────────────────────────────────

type PaymentMethod = 'COD' | 'CARD' | 'NET_BANKING' | 'UPI' | 'RESERVE';

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
  contact?: string;
  email?: string;
  handler?: (r: RazorpayHandlerResponse) => void;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
}

declare global {
  interface Window {
    Razorpay: new (o: RazorpayOptions) => {
      once: (event: string, handler: (data: unknown) => void) => void;
      open: () => void;
      createPayment: (data: Record<string, unknown>, options?: { app: string }) => void;
      getSupportedUpiIntentApps: () => Promise<unknown>;
      on: (event: string, handler: (data: unknown) => void) => void;
    };
  }
}

// ─── COD limit ────────────────────────────────────────────────────────────────

const COD_LIMIT = 29_000;

// ─── Payment method config ────────────────────────────────────────────────────

const METHODS: {
  id: PaymentMethod;
  label: string;
  desc: string;
  icon: React.ElementType;
}[] = [
  {
    id: 'COD',
    label: 'Cash on Delivery',
    desc: 'Pay when your order arrives',
    icon: Truck,
  },
  {
    id: 'CARD',
    label: 'Credit / Debit Card',
    desc: 'Visa, Mastercard, RuPay',
    icon: CreditCard,
  },
  {
    id: 'NET_BANKING',
    label: 'Net Banking',
    desc: 'All major banks supported',
    icon: Building2,
  },
  {
    id: 'UPI',
    label: 'UPI',
    desc: 'Scan QR or pay using a UPI app',
    icon: QrCode,
  },
  {
    id: 'RESERVE',
    label: 'Reserve This Piece',
    desc: 'Our team will contact you via WhatsApp to arrange payment',
    icon: Phone,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);

// ─── Create order helper ──────────────────────────────────────────────────────

async function createOrder(
  items: CartItem[],
  userId: string,
  addressId: number,
  paymentMethod: PaymentMethod,
  totalAmount: number
) {
  const payload = {
    userId,
    addressId: String(addressId),
    paymentMethod,
    totalAmount,
    items: items.map((item) => ({
      productId: item.product.productId,
      variantId: item.variant?.variantId ?? null,
      quantity: item.quantity,
      subtotal: item.subtotal,
      orderType: item.itemType ?? 'READY_MADE',
    })),
  };

  const r = await clientFetch('/api/order/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(`Order creation failed (${r.status})`);
  return r.json();
}

// ─── Checkout Steps ───────────────────────────────────────────────────────────

const STEPS = ['BAG', 'ADDRESS', 'PAYMENT'] as const;

function CheckoutSteps() {
  return (
    <div className="w-full border-b border-black/8 bg-white">
      <div className="px-6 md:px-12 h-10 flex items-center justify-between relative">
        <div className="flex items-center gap-5 mx-auto">
          {STEPS.map((step, i) => {
            const isActive = i === 2;
            const isDone = i < 2;
            return (
              <div key={step} className="flex items-center gap-5">
                <div className="flex flex-col items-center">
                  <span
                    className="text-[0.6rem] tracking-[2px] uppercase transition-colors duration-200"
                    style={{
                      color: isActive
                        ? '#1B1B1B'
                        : isDone
                          ? 'rgba(27,27,27,0.45)'
                          : 'rgba(27,27,27,0.2)',
                    }}
                  >
                    {step}
                  </span>
                  <div
                    className="h-px w-full mt-0.5 transition-all duration-300"
                    style={{ background: isActive ? '#1B1B1B' : 'transparent' }}
                  />
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex gap-0.5 pb-1">
                    {Array.from({ length: 5 }).map((_, d) => (
                      <span
                        key={d}
                        className="w-1 h-px"
                        style={{
                          background: isDone
                            ? 'rgba(27,27,27,0.25)'
                            : 'rgba(27,27,27,0.1)',
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-1.5 absolute right-6 md:right-12">
          <ShieldCheck
            strokeWidth={1.5}
            className="w-3 h-3 text-[#1B1B1B]/25"
          />
          <span className="hidden sm:block text-[0.6rem] tracking-[1.5px] uppercase text-[#1B1B1B]/25">
            Secure
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Security badge ───────────────────────────────────────────────────────────

function SecurityBadge() {
  return (
    <div className="flex items-center justify-center gap-3">
      <div className="flex items-center gap-1.5">
        <ShieldCheck strokeWidth={1.5} className="w-3 h-3 text-[#1B1B1B]/25" />
        <span className="text-[0.6rem] tracking-[1.5px] uppercase text-[#1B1B1B]/25">
          Secured by Razorpay
        </span>
      </div>
      <span className="text-[#1B1B1B]/15">·</span>
      <span className="text-[0.6rem] tracking-[1.5px] uppercase text-[#1B1B1B]/25">
        256-bit SSL
      </span>
    </div>
  );
}

// ─── Card visual sub-components ───────────────────────────────────────────────

function ChipSVG() {
  return (
    <svg width="42" height="32" viewBox="0 0 42 32" fill="none">
      <defs>
        <linearGradient
          id="cardChipGrad"
          x1="0"
          y1="0"
          x2="42"
          y2="32"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#d4af70" />
          <stop offset="50%" stopColor="#f0d080" />
          <stop offset="100%" stopColor="#b8943a" />
        </linearGradient>
      </defs>
      <rect width="42" height="32" rx="5" fill="url(#cardChipGrad)" />
      <line
        x1="14"
        y1="0"
        x2="14"
        y2="32"
        stroke="rgba(0,0,0,0.18)"
        strokeWidth="1"
      />
      <line
        x1="28"
        y1="0"
        x2="28"
        y2="32"
        stroke="rgba(0,0,0,0.18)"
        strokeWidth="1"
      />
      <line
        x1="0"
        y1="10"
        x2="42"
        y2="10"
        stroke="rgba(0,0,0,0.18)"
        strokeWidth="1"
      />
      <line
        x1="0"
        y1="22"
        x2="42"
        y2="22"
        stroke="rgba(0,0,0,0.18)"
        strokeWidth="1"
      />
      <rect
        x="14"
        y="10"
        width="14"
        height="12"
        rx="1"
        fill="rgba(0,0,0,0.08)"
      />
    </svg>
  );
}

function MastercardLogo() {
  return (
    <svg width="44" height="28" viewBox="0 0 44 28">
      <circle cx="15" cy="14" r="12" fill="#EB001B" />
      <circle cx="29" cy="14" r="12" fill="#F79E1B" />
      <path
        d="M22 4.25 A12 12 0 0 1 22 23.75 A12 12 0 0 0 22 4.25 Z"
        fill="#FF5F00"
      />
    </svg>
  );
}

function VisaLogo({ width = 60 }: { width?: number }) {
  const h = Math.round(width * (155 / 325));
  return (
    <svg
      width={width}
      height={h}
      viewBox="0 0 325 155"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0 0 C6.886672 -0.10148186 13.77315092 -0.1714999 20.66040039 -0.21972656 C23.00292161 -0.23983265 25.3453927 -0.26712166 27.68774414 -0.30175781 C31.05627823 -0.35031841 34.42414831 -0.37297922 37.79296875 -0.390625 C38.83897751 -0.41127014 39.88498627 -0.43191528 40.96269226 -0.45318604 C48.23750425 -0.45542732 48.23750425 -0.45542732 52.07543945 1.83691406 C55.21104734 5.36114162 56.36495316 7.98790022 57.21875 12.55859375 C57.42886719 13.66783203 57.63898437 14.77707031 57.85546875 15.91992188 C58.06816406 17.08072266 58.28085937 18.24152344 58.5 19.4375 C58.71269531 20.56349609 58.92539062 21.68949219 59.14453125 22.84960938 C60.36379197 29.35357991 61.49755672 35.86758651 62.55273438 42.40014648 C63.09381769 45.54534095 63.77351419 48.64535899 64.4921875 51.75390625 C65.41117379 55.8186533 66.19755012 59.91092031 67 64 C69.23940055 60.64089917 70.61941471 57.17247982 72.08203125 53.4375 C72.37808762 52.69097168 72.67414398 51.94444336 72.97917175 51.17529297 C73.9269205 48.78482111 74.87015508 46.39260677 75.8125 44 C79.35581429 35.01131663 82.88803606 26.06116974 86.96557617 17.29785156 C88.42968629 14.04550217 89.59741003 10.75044206 90.75 7.375 C92.9009901 1.0990099 92.9009901 1.0990099 94 0 C95.99964982 -0.08758003 98.0023611 -0.10696576 100.00390625 -0.09765625 C101.21884766 -0.09443359 102.43378906 -0.09121094 103.68554688 -0.08789062 C104.96494141 -0.07951172 106.24433594 -0.07113281 107.5625 -0.0625 C108.84576172 -0.05798828 110.12902344 -0.05347656 111.45117188 -0.04882812 C114.63416022 -0.03699545 117.81705762 -0.02051068 121 0 C118.60455534 7.77438538 115.45878624 15.17985412 112.24679565 22.64154053 C110.66425862 26.31877455 109.09308507 30.00084255 107.5234375 33.68359375 C107.0614521 34.76722198 107.0614521 34.76722198 106.59013367 35.8727417 C103.81255736 42.40591874 101.14639093 48.98036412 98.57348633 55.59692383 C97.04319858 59.50685644 95.40608573 63.33859186 93.6484375 67.15234375 C90.61995491 73.74681445 87.90411647 80.45991086 85.1875 87.1875 C83.475625 91.415625 81.76375 95.64375 80 100 C70.76 100 61.52 100 52 100 C49.35504916 91.40390976 46.94041746 82.98509553 44.9375 74.25 C43.45262745 67.78273018 41.89159059 61.46329683 39.7121582 55.19433594 C38.41475819 51.19672493 37.55010126 47.09649284 36.625 43 C35.01274145 36.12033596 33.37418624 29.25108833 31.5 22.4375 C31.23437256 21.39432617 31.23437256 21.39432617 30.96337891 20.33007812 C29.64409342 15.69118824 28.12077617 13.48706245 24 11 C21.25850324 9.79020264 18.46897361 8.81470457 15.625 7.875 C14.89539062 7.62363281 14.16578125 7.37226562 13.4140625 7.11328125 C8.97856496 5.60045977 4.5159102 4.25110969 0 3 C0 2.01 0 1.02 0 0 Z"
        fill="#ffffff"
        transform="translate(3,30)"
      />
      <path
        d="M0 0 C8.58 0 17.16 0 26 0 C23.75760338 13.22868396 21.08119777 26.32367966 18.25 39.4375 C17.35882884 43.58554226 16.47005613 47.73409564 15.58203125 51.8828125 C15.3623317 52.90834732 15.14263214 53.93388214 14.91627502 54.99049377 C13.52354361 61.5061366 12.15874675 68.02688031 10.82421875 74.5546875 C10.66049774 75.35538162 10.49677673 76.15607574 10.32809448 76.98103333 C9.57045232 80.69336418 8.81760929 84.40661978 8.06933594 88.12084961 C7.80797852 89.40741455 7.54662109 90.69397949 7.27734375 92.01953125 C7.05296631 93.13432861 6.82858887 94.24912598 6.59741211 95.39770508 C6 98 6 98 5 100 C-3.58 100 -12.16 100 -21 100 C-19.87511165 92.12578157 -19.87511165 92.12578157 -19.17138672 88.79760742 C-19.01361252 88.04575165 -18.85583832 87.29389587 -18.69328308 86.51925659 C-18.52379654 85.7227066 -18.35431 84.92615662 -18.1796875 84.10546875 C-18.00025101 83.25268341 -17.82081451 82.39989807 -17.63594055 81.52127075 C-17.05099759 78.74291328 -16.46303388 75.96520477 -15.875 73.1875 C-15.05487842 69.29971289 -14.23626871 65.41160838 -13.41796875 61.5234375 C-13.21277115 60.54931412 -13.00757355 59.57519073 -12.79615784 58.57154846 C-11.50650179 52.4397867 -10.23700711 46.30428471 -8.98828125 40.1640625 C-8.83335205 39.40376236 -8.67842285 38.64346222 -8.51879883 37.86012268 C-7.64562063 33.57295888 -7.64562063 33.57295888 -6.77996826 29.28427124 C-4.80117043 19.43713469 -2.48748998 9.7287298 0 0 Z"
        fill="#ffffff"
        transform="translate(135,30)"
      />
      <path
        d="M0 0 C-0.6377902 7.52592433 -2.19889833 14.67098882 -4 22 C-5.03833984 21.566875 -5.03833984 21.566875 -6.09765625 21.125 C-15.21156172 17.66675919 -25.90295598 15.62709526 -35.3125 19.3125 C-38.21553887 20.87948487 -38.21553887 20.87948487 -40 24 C-40.30025049 26.4413266 -40.30025049 26.4413266 -39 29 C-34.73985445 33.29676571 -29.23907342 36.02574267 -24 38.9375 C-15.89487391 43.46219067 -8.6873835 48.11322827 -5 57 C-4.44367214 59.79496656 -4.37930871 62.468843 -4.4375 65.3125 C-4.44628174 66.05798096 -4.45506348 66.80346191 -4.46411133 67.5715332 C-4.69945159 73.96598485 -6.30921746 78.72598484 -10 84 C-10.70125 85.0725 -11.4025 86.145 -12.125 87.25 C-23.49561014 98.12623578 -39.43191914 100.51668554 -54.5625 100.296875 C-62.14166181 99.96469349 -71.18263725 98.40868137 -78 95 C-77.3622098 87.47407567 -75.80110167 80.32901118 -74 73 C-70.30429989 73.63488519 -67.05362009 74.71156726 -63.5625 76.0625 C-55.38257401 78.82612481 -46.53315788 79.50857551 -38.25 76.6875 C-34.80523214 75.23091085 -34.80523214 75.23091085 -33 72 C-32.41657647 68.54230809 -32.41657647 68.54230809 -33 65 C-36.1835053 61.95015332 -39.76035137 59.94990002 -43.62207031 57.90649414 C-53.75271754 52.54060404 -63.70638228 46.90083783 -67.44921875 35.40625 C-69.21301222 27.7005991 -67.72439959 20.64251269 -63.74609375 13.86328125 C-57.01344042 4.23210141 -47.60888468 -0.53577283 -36.375 -3.25 C-23.5609278 -5.45586532 -12.26068772 -3.94596846 0 0 Z"
        fill="#ffffff"
        transform="translate(236,32)"
      />
      <path
        d="M0 0 C1.16781006 0.00523682 2.33562012 0.01047363 3.53881836 0.01586914 C4.79887695 0.0190918 6.05893555 0.02231445 7.35717773 0.02563477 C8.6976732 0.03399136 10.03816799 0.04245632 11.37866211 0.05102539 C12.72306153 0.05603879 14.06746271 0.06060197 15.41186523 0.06469727 C18.71334151 0.07653051 22.01473014 0.09301568 25.31616211 0.11352539 C25.55737793 1.29978516 25.79859375 2.48604492 26.04711914 3.70825195 C31.69762061 31.55860123 31.69762061 31.55860123 37.56616211 59.36352539 C37.91662598 60.98919434 37.91662598 60.98919434 38.27416992 62.64770508 C38.72779172 64.75027742 39.18156317 66.85281749 39.63549805 68.95532227 C40.83174098 74.5057522 42.01715618 80.05835038 43.19116211 85.61352539 C43.40675781 86.61802734 43.62235352 87.6225293 43.84448242 88.6574707 C44.03880859 89.58140625 44.23313477 90.5053418 44.43334961 91.45727539 C44.60463379 92.26358398 44.77591797 93.06989258 44.95239258 93.90063477 C45.31616211 96.11352539 45.31616211 96.11352539 45.31616211 100.11352539 C37.39616211 100.11352539 29.47616211 100.11352539 21.31616211 100.11352539 C20.32616211 95.16352539 19.33616211 90.21352539 18.31616211 85.11352539 C1.98116211 85.60852539 1.98116211 85.60852539 -14.68383789 86.11352539 C-16.33383789 90.73352539 -17.98383789 95.35352539 -19.68383789 100.11352539 C-28.59383789 100.11352539 -37.50383789 100.11352539 -46.68383789 100.11352539 C-45.56005939 93.37085438 -45.56005939 93.37085438 -44.14477539 90.19946289 C-43.81960937 89.45776855 -43.49444336 88.71607422 -43.15942383 87.9519043 C-42.79623047 87.13898926 -42.43303711 86.32607422 -42.05883789 85.48852539 C-41.23652305 83.60919193 -40.41637997 81.72890734 -39.59790039 79.84790039 C-39.13802734 78.79151367 -38.6781543 77.73512695 -38.2043457 76.64672852 C-35.5464727 70.47063055 -32.97330207 64.25934412 -30.39453125 58.04989624 C-29.43117131 55.73210975 -28.46511479 53.41546464 -27.49829102 51.09912109 C-24.60898507 44.17297025 -21.72931305 37.24368172 -18.90429688 30.29101562 C-17.73924874 27.42721545 -16.56499971 24.5672369 -15.38952637 21.70770264 C-14.84155602 20.36749038 -14.29807516 19.02543253 -13.75939941 17.68145752 C-13.01385258 15.82216578 -12.25153123 13.96962708 -11.48852539 12.11743164 C-11.06555176 11.07401611 -10.64257812 10.03060059 -10.20678711 8.95556641 C-8.46887474 5.71237341 -6.38526587 3.58868322 -3.68383789 1.11352539 C-2.68383789 0.11352539 -2.68383789 0.11352539 0 0 Z"
        fill="#ffffff"
        transform="translate(277.683837890625,29.886474609375)"
      />
    </svg>
  );
}

// ─── Page state ───────────────────────────────────────────────────────────────

type PageState =
  | 'idle'
  | 'creating_order'
  | 'initiating_payment'
  | 'collecting_details'
  | 'paying'
  | 'verifying'
  | 'placing_order'
  | 'success'
  | 'failed';

// ─── Input style ──────────────────────────────────────────────────────────────

const inputCls =
  'w-full border-b border-black/15 bg-transparent text-[13.5px] font-light text-[#1B1B1B] pb-3 pt-1 outline-none focus:border-[#1B1B1B] placeholder:text-[#1B1B1B]/25 transition-colors duration-200';

const labelCls =
  'block text-[0.7rem] tracking-[1.5px] uppercase text-[#1B1B1B]/75 mb-2';

// ─── Payment Page ─────────────────────────────────────────────────────────────

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const addressId = Number(searchParams.get('addressId'));

  const addresses = useAddressStore((s) => s.addresses);
  const clearCart = useCartStore((s) => s.clearCart);
  const selectedAddress = addresses.find((a) => a.id === addressId);

  const [cart, setCart] = useState<CartResponse | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageState, setPageState] = useState<PageState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod>('COD');
  const [cartCleanupPending, setCartCleanupPending] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);

  const [pendingOrder, setPendingOrder] = useState<OrderResponse | null>(null);
  const [completedPayment, setCompletedPayment] = useState<RazorpayHandlerResponse | null>(null);
  const [rzpOrderId, setRzpOrderId] = useState<string | null>(null);
  const [reservationExpiresAt, setReservationExpiresAt] = useState<string | null>(null);
  const [rzpKeyId, setRzpKeyId] = useState<string | null>(null);
  const [rzpAmount, setRzpAmount] = useState<number | null>(null);

  const isHighValue = (cart?.estimatedTotal ?? 0) > COD_LIMIT;

  // Build the list of methods shown to user — swap out COD for RESERVE on high-value orders
  const availableMethods = METHODS.filter((m) => {
    if (m.id === 'COD' && isHighValue) return false;
    if (m.id === 'RESERVE' && !isHighValue) return false;
    return true;
  });

  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [banks, setBanks] = useState<{ code: string; name: string }[]>([]);
  const netbankingClient = useRef<NetbankingClient | null>(null);
  const [onlinePending, setOnlinePending] = useState(false);
  const upiClient = useRef<InstanceType<Window['Razorpay']> | null>(null);
  const [upiApps, setUpiApps] = useState<{ code: string; name: string }[]>([]);
  const [upiChoice, setUpiChoice] = useState('qr');
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // If the bank window closes without an event, let the customer check the
  // existing payment. Never start another payment while its outcome is unknown.
  useEffect(() => {
    if (!onlinePending || pageState !== 'paying') return;
    const timeout = setTimeout(() => {
      setErrorMsg('Waiting for payment. Complete it in your bank or UPI app, or check payment status here.');
      setPageState('idle');
    }, 45000);
    return () => clearTimeout(timeout);
  }, [onlinePending, pageState]);

  // ── Auto-switch away from COD when cart exceeds limit ─────────────────────

  useEffect(() => {
    if (isHighValue && method === 'COD') setMethod('CARD');
  }, [isHighValue, method]);

  // ── Load Razorpay script ───────────────────────────────────────────────────

  useEffect(() => {
    const RZP_SRC = 'https://checkout.razorpay.com/v1/razorpay.js';
    if (document.querySelector(`script[src="${RZP_SRC}"]`)) return;
    const script = document.createElement('script');
    script.src = RZP_SRC;
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // ── Fetch cart + profile ───────────────────────────────────────────────────

  useEffect(() => {
    if (status === 'unauthenticated') { router.replace('/login'); return; }
    if (status !== 'authenticated') return;
    if (!addressId) {
      router.replace('/checkout');
      return;
    }
    Promise.all([
      clientFetch('/api/cart')
        .then((r) => r.json())
        .catch(() => null),
      clientFetch('/api/customer/profile')
        .then((r) => r.json())
        .catch(() => null),
    ])
      .then(([cartData, profileData]) => {
        if (!cartData?.items?.length) {
          router.replace('/cart');
          return;
        }
        setCart(cartData);
        setProfile(profileData);
      })
      .finally(() => setLoading(false));
  }, [status, addressId, router]);

  useEffect(() => {
    if (!loading && addressId && addresses.length > 0 && !selectedAddress) {
      router.replace('/checkout');
    }
  }, [loading, addresses, selectedAddress, addressId, router]);

  // ── COD flow ───────────────────────────────────────────────────────────────

  const handleCOD = async () => {
    if (!cart || !profile) return;
    setErrorMsg(null);
    setPageState('creating_order');
    const userId = profile.authentication.auth.userId;
    try {
      const response = await createOrder(
        cart.items,
        userId,
        addressId,
        'COD',
        cart.estimatedTotal
      );
      setSuccessOrderId(response.orderId ?? null);
      const cartCleared = await clearCart();
      setCartCleanupPending(!cartCleared);
      setPageState('success');
    } catch {
      setErrorMsg('Failed to place order. Please try again.');
      setPageState('failed');
    }
  };

  // ── Reserve flow ──────────────────────────────────────────────────────────

  const handleReserve = async () => {
    if (!cart || !profile) return;
    setErrorMsg(null);
    setPageState('creating_order');
    try {
      const r = await clientFetch('/api/order/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.authentication.auth.userId,
          addressId: String(addressId),
          totalAmount: cart.estimatedTotal,
          items: cart.items.map((item) => ({
            productId: item.product.productId,
            variantId: item.variant?.variantId ?? null,
            quantity: item.quantity,
            subtotal: item.subtotal,
            orderType: item.itemType ?? 'READY_MADE',
          })),
        }),
      });
      if (!r.ok) throw new Error('Reservation failed');
      const data = await r.json();
      setSuccessOrderId(data.orderId ?? data.reservationId ?? null);
      await clearCart();
      setPageState('success');
    } catch {
      setErrorMsg('Could not place reservation. Please try again or contact us directly.');
      setPageState('failed');
    }
  };

  // Verify payment and confirm the existing order on the server.
  const handlePaymentSuccess = async (response: RazorpayHandlerResponse) => {
    setCompletedPayment(response);
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
      if (!vr.ok || result.message !== 'Payment successful' || !result.orderId)
        throw new Error('Payment confirmation failed');
      setSuccessOrderId(result.orderId);
      // A cart cleanup failure must not turn a confirmed payment into a failure.
      await clearCart().catch(() => undefined);
      setPageState('success');
      router.replace(`/orders/${encodeURIComponent(result.orderId)}`);
    } catch {
      setErrorMsg('Payment confirmation is pending. Retry to check the same payment; do not pay again.');
      setPageState('failed');
    }
  };

  const handleOnlinePayment = async () => {
    if (!cart || !profile) return;
    setErrorMsg(null);
    if (completedPayment) {
      await handlePaymentSuccess(completedPayment);
      return;
    }
    if (method === 'NET_BANKING' && (!profile.authentication.auth.email?.trim() || !profile.authentication.auth.phoneNumber?.trim())) {
      setErrorMsg('Add your email and phone number to your profile before paying.');
      return;
    }
    setPageState('creating_order');
    try {
      // Keep the same pending order for retries on this page.
      const order = pendingOrder ?? await createOrder(
        cart.items, profile.authentication.auth.userId, addressId,
        method, cart.estimatedTotal
      );
      if (!order.orderId) throw new Error('Missing order ID');
      setPendingOrder(order);
      setPageState('initiating_payment');
      const r = await clientFetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.orderId,
          amount: order.totalAmount ?? cart.estimatedTotal,
          paymentMethod: method,
        }),
      });
      if (!r.ok) throw new Error('Payment service error');
      const data = await r.json();
      setRzpOrderId(data.razorpayOrderId);
      setRzpKeyId(data.keyId);
      setRzpAmount(data.amount);
      setReservationExpiresAt(data.expiresAt);
      if (method === 'UPI') {
        if (!window.Razorpay) {
          setErrorMsg('Payment form is loading. Please try again.');
          setPageState('idle');
          return;
        }
        const client = new window.Razorpay({ key: data.keyId, order_id: data.razorpayOrderId, amount: data.amount, currency: 'INR', name: 'Gajraj Paithani' });
        upiClient.current = client;
        setUpiApps([]);
        setUpiChoice('qr');
        // App discovery is optional; desktop and unsupported devices use QR.
        if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) && client.getSupportedUpiIntentApps) {
          void client.getSupportedUpiIntentApps().then((apps) => {
            if (upiClient.current === client) setUpiApps(supportedUpiApps(apps));
          }).catch(() => undefined);
        }
      }
      if (method === 'NET_BANKING') {
        try {
          if (!window.Razorpay) throw new Error('Payment form is loading. Please try again.');
          const client = new window.Razorpay({ key: data.keyId, order_id: data.razorpayOrderId, amount: data.amount, currency: 'INR', name: 'Gajraj Paithani' });
          const availableBanks = await loadBanks(client);
          netbankingClient.current = client;
          setBanks(availableBanks);
          setBankCode(availableBanks[0].code);
        } catch (error) {
          setErrorMsg(error instanceof Error ? error.message : 'Could not load banks. Please try again.');
          setPageState('idle');
          return;
        }
      }
      setPageState('collecting_details');
    } catch {
      if (rzpOrderId) { await handlePaymentFailure(); return; }
      setPendingOrder(null);
      setErrorMsg('Could not initiate payment. Please try again.');
      setPageState('failed');
    }
  };
  // ── Custom form submit ─────────────────────────────────────────────────────

  const handlePaymentFailure = async (bankError?: string) => {
    setPageState('verifying');
    try {
      const response = await clientFetch('/api/payment/failure', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ razorpayOrderId: rzpOrderId }),
      });
      if (!response.ok) throw new Error('Unable to check payment');
      const result = await response.json();
      if (result.status === 'PAID' && result.orderId) {
        await clearCart().catch(() => undefined);
        setPageState('success');
        router.replace(`/orders/${encodeURIComponent(result.orderId)}`);
        return;
      }
      if (result.status === 'FAILED') {
        setOnlinePending(false);
        setCompletedPayment(null);
        setPendingOrder(null); setRzpOrderId(null); setRzpKeyId(null); setRzpAmount(null);
        setErrorMsg((bankError ? bankError + ' ' : '') + 'Payment failed. Reserved stock has been released. You can try again.');
      } else {
        setErrorMsg((bankError ? bankError + ' ' : '') + 'Payment status is pending. Check status before paying again.');
      }
    } catch {
      setErrorMsg('Could not check payment. Please wait; your stock reservation expires after 15 minutes.');
    }
    setPageState('idle');
  };

  const handleCustomPaymentSubmit = () => {
    if (!rzpOrderId || !rzpKeyId || !rzpAmount || !profile) return;
    if (reservationExpiresAt && Date.now() >= Date.parse(reservationExpiresAt)) {
      void handlePaymentFailure();
      return;
    }
    if (!window.Razorpay) { setErrorMsg('Payment form is loading. Please try again.'); return; }
    setErrorMsg(null);
    setPageState('paying');

    const auth = profile.authentication?.auth;

    if (method === 'CARD') {
      const rzp = new window.Razorpay({
        key: rzpKeyId,
        order_id: rzpOrderId,
        amount: rzpAmount,
        currency: 'INR',
        name: 'Gajraj Paithani',
        prefill: {
          email: auth?.email ?? '',
          contact: auth?.phoneNumber ?? '',
        },
      });

      rzp.on('payment.success', (data: unknown) => {
        handlePaymentSuccess(data as RazorpayHandlerResponse);
      });
      rzp.on('payment.error', (err) => {
        console.log('payment.error (card):', err);
        void handlePaymentFailure();
      });

      const parts = cardExpiry.split('/');
      const month = parts[0]?.trim();
      const yearShort = parts[1]?.trim();
      const year = yearShort?.length === 2 ? `20${yearShort}` : yearShort;

      rzp.createPayment({
        method: 'card',
        'card[number]': cardNumber.replace(/\s/g, ''),
        'card[expiry_month]': month,
        'card[expiry_year]': year,
        'card[cvv]': cardCvv.trim(),
        'card[name]': cardName.trim(),
        contact: auth?.phoneNumber ?? '',
        email: auth?.email ?? '',
      });
    } else if (method === 'UPI') {
      const client = upiClient.current;
      if (!client) { setErrorMsg('UPI checkout is not ready. Please try again.'); setPageState('idle'); return; }
      try {
        const data = upiPayload(rzpOrderId, rzpAmount, auth?.email ?? '', auth?.phoneNumber ?? '', upiChoice === 'qr', reservationExpiresAt);
        client.once('payment.success', (response) => { void handlePaymentSuccess(response as RazorpayHandlerResponse); });
        client.once('payment.error', (response) => { void handlePaymentFailure(netbankingError(response)); });
        setOnlinePending(true);
        // User click opens Razorpay's QR page or selected supported mobile UPI app.
        if (upiChoice === 'qr') client.createPayment(data);
        else client.createPayment(data, { app: upiChoice });
      } catch (error) {
        setOnlinePending(true);
        void handlePaymentFailure(error instanceof Error ? error.message : 'Could not start UPI payment.');
      }
    } else {
      const client = netbankingClient.current;
      try {
        if (!client || !banks.some((bank) => bank.code === bankCode)) throw new Error('Select an available bank.');
        const data = netbankingPayload(rzpOrderId, rzpAmount, bankCode, auth?.email ?? '', auth?.phoneNumber ?? '');
        client.once('payment.success', (response) => {
          void handlePaymentSuccess(response as RazorpayHandlerResponse);
        });
        client.once('payment.error', (response) => {
          void handlePaymentFailure(netbankingError(response));
        });
        setOnlinePending(true);
        // Keep this call synchronous inside the click handler so the bank popup can open.
        client.createPayment(data);
      } catch (error) {
        // Submission may have reached the gateway: reconcile before allowing another attempt.
        setOnlinePending(true);
        void handlePaymentFailure(error instanceof Error ? error.message : 'Could not open the bank payment.');
      }
    }
  };

  const handlePlaceOrder = () => {
    if (isProcessing) return;
    if (onlinePending) { void handlePaymentFailure(); return; }
    if (completedPayment) { void handlePaymentSuccess(completedPayment); return; }
    if (method === 'COD') handleCOD();
    else if (method === 'RESERVE') handleReserve();
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
    paying: 'Processing payment…',
    verifying: 'Verifying payment…',
    placing_order: 'Confirming order…',
  };

  const totalQty = cart?.items?.reduce((s, i) => s + i.quantity, 0) ?? 0;

  // ── Success screen ─────────────────────────────────────────────────────────

  if (pageState === 'success') {
    const isReservation = method === 'RESERVE';
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6 px-6">
        {cartCleanupPending && (
          <div role="alert" className="text-center text-sm">
            <p>Your order is placed. Cart cleanup is pending; do not place it again.</p>
            <button className="underline mt-2" onClick={async () => setCartCleanupPending(!(await clearCart()))}>Retry clearing cart</button>
          </div>
        )}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          {isReservation ? (
            <MessageCircle strokeWidth={1} className="w-16 h-16 text-[#1B1B1B]/20" />
          ) : (
            <CheckCircle2 strokeWidth={1} className="w-16 h-16 text-[#1B1B1B]/20" />
          )}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center flex flex-col gap-2 max-w-sm"
        >
          <h1
            className="font-light text-[#1B1B1B] tracking-[-0.02em]"
            style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)' }}
          >
            {isReservation ? 'Reservation confirmed' : method === 'COD' ? 'Order placed' : 'Payment successful'}
          </h1>
          <p className="text-[13px] font-light text-[#1B1B1B]/55 leading-relaxed">
            {isReservation
              ? 'Your piece is reserved. Our team will reach out within 24 hours via WhatsApp to confirm details and arrange payment.'
              : method === 'COD'
                ? 'Your order is confirmed. Pay when it arrives.'
                : 'Your payment is verified and order has been placed.'}
          </p>
        </motion.div>

        {/* Reservation steps */}
        {isReservation && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="border border-black/8 p-5 flex flex-col gap-3 max-w-sm w-full"
          >
            <p className="text-[0.625rem] tracking-[2px] uppercase text-[#1B1B1B]/40 mb-1">What happens next</p>
            {[
              'Our team reviews your reservation',
              'You receive a WhatsApp message with product details and payment options',
              'Payment is arranged at your convenience — UPI, bank transfer, or in person',
              'Order is dispatched once payment is confirmed',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span
                  className="w-5 h-5 shrink-0 flex items-center justify-center text-[0.6rem] font-light mt-0.5"
                  style={{ border: '1px solid rgba(27,27,27,0.15)', color: 'rgba(27,27,27,0.4)' }}
                >
                  {i + 1}
                </span>
                <p className="text-[12.5px] font-light text-[#1B1B1B]/65 leading-relaxed">{step}</p>
              </div>
            ))}
          </motion.div>
        )}

        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: isReservation ? 0.45 : 0.35 }}
          onClick={() =>
            router.push(
              successOrderId ? `/orders/${successOrderId}` : '/orders'
            )
          }
          className="bg-black rounded-full  text-white text-[0.725rem] tracking-[1.5px] uppercase px-10 py-4 hover:opacity-80 transition-opacity duration-200 cursor-pointer"
        >
          {isReservation ? 'View My Reservation' : 'View My Orders'}
        </motion.button>
      </div>
    );
  }

  // ── Custom payment details screen ──────────────────────────────────────────

  if (pageState === 'collecting_details') {
    const methodConfig = METHODS.find((m) => m.id === method)!;
    const MethodIcon = methodConfig.icon;

    const rawNum = cardNumber.replace(/\s/g, '');
    const cardBrand = rawNum.startsWith('4')
      ? 'visa'
      : /^5[1-5]/.test(rawNum) || /^2[2-7]/.test(rawNum)
        ? 'mastercard'
        : rawNum.startsWith('6')
          ? 'rupay'
          : null;
    const displayCardNumber = [0, 4, 8, 12]
      .map((s) => (rawNum.slice(s, s + 4) || '').padEnd(4, '•'))
      .join('  ');

    const isFormValid =
      method === 'CARD'
        ? cardNumber.replace(/\s/g, '').length >= 12 &&
          cardExpiry.includes('/') &&
          cardCvv.length >= 3 &&
          cardName.trim().length > 0
        : true;

    return (
      <div className="min-h-screen bg-white flex flex-col">
        <CheckoutSteps />
        <div className="max-w-lg mx-auto w-full px-6 py-8 flex flex-col gap-6">
          {/* Error banner */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-4 border border-black/8 flex items-start gap-3"
              >
                <AlertCircle
                  strokeWidth={1.5}
                  className="w-4 h-4 shrink-0 mt-0.5 text-[#1B1B1B]/40"
                />
                <p className="text-[12.5px] font-light text-[#1B1B1B]/70">
                  {errorMsg}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Back */}
          <button
            onClick={() => {
              setPageState('idle');
              setErrorMsg(null);
            }}
            className="flex items-center gap-1.5 text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/45 hover:text-[#1B1B1B] transition-colors duration-200 cursor-pointer self-start"
          >
            <ArrowLeft strokeWidth={1.5} className="w-3 h-3" />
            Change method
          </button>

          {/* Payment form */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="border border-black/8 p-6 flex flex-col gap-6"
          >
            {/* Method header */}
            <div className="flex items-center gap-3 border-b border-black/8 pb-5">
              <div className="w-8 h-8 bg-[#1B1B1B] flex items-center justify-center shrink-0">
                <MethodIcon
                  strokeWidth={1.5}
                  className="w-3.5 h-3.5 text-white"
                />
              </div>
              <div>
                <p className="text-[13px] font-light text-[#1B1B1B]">
                  {methodConfig.label}
                </p>
                <p className="text-[0.65rem] tracking-[1.5px] uppercase text-[#1B1B1B]/35">
                  Enter payment details
                </p>
              </div>
            </div>

            {/* ── CARD ─────────────────────────────────────────────── */}
            {method === 'CARD' && (
              <div className="flex flex-col gap-5">
                {/* Visual card */}
                <div style={{ perspective: '1200px', width: '100%' }}>
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      paddingBottom: '63%',
                      transition: 'transform 0.65s cubic-bezier(0.23,1,0.32,1)',
                      transformStyle: 'preserve-3d',
                      transform: isCardFlipped
                        ? 'rotateY(180deg)'
                        : 'rotateY(0deg)',
                    }}
                  >
                    {/* Front */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility:
                          'hidden' as React.CSSProperties['WebkitBackfaceVisibility'],
                        borderRadius: '16px',
                        background:
                          'linear-gradient(145deg, #141414 0%, #2a2a2a 55%, #141414 100%)',
                        boxShadow:
                          '0 24px 48px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.07)',
                        padding: '6% 7%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          pointerEvents: 'none',
                          borderRadius: '16px',
                          background:
                            'linear-gradient(135deg, rgba(255,255,255,0.055) 0%, transparent 55%)',
                        }}
                      />
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '11px',
                            color: 'rgba(255,255,255,0.55)',
                            letterSpacing: '2.5px',
                            fontWeight: 400,
                          }}
                        >
                          GAJRAJ PAITHANI
                        </span>
                        {cardBrand === 'mastercard' && <MastercardLogo />}
                        {cardBrand === 'visa' && <VisaLogo />}
                        {cardBrand === 'rupay' && (
                          <span
                            style={{
                              fontSize: '13px',
                              fontWeight: 700,
                              color: '#fff',
                              letterSpacing: '0.5px',
                            }}
                          >
                            RuPay
                          </span>
                        )}
                      </div>
                      <div>
                        <ChipSVG />
                      </div>
                      <div
                        style={{
                          fontFamily: 'monospace',
                          fontSize: 'clamp(13px, 4vw, 19px)',
                          letterSpacing: '3px',
                          color: '#ffffff',
                          textShadow: '0 1px 4px rgba(0,0,0,0.4)',
                        }}
                      >
                        {displayCardNumber}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-end',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '3px',
                            maxWidth: '60%',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '8px',
                              color: 'rgba(255,255,255,0.45)',
                              letterSpacing: '1.5px',
                              textTransform: 'uppercase',
                            }}
                          >
                            Card Holder
                          </span>
                          <span
                            style={{
                              fontSize: 'clamp(10px, 2.5vw, 13px)',
                              color: '#fff',
                              letterSpacing: '1.5px',
                              fontWeight: 500,
                              textTransform: 'uppercase',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {cardName.trim() || 'FULL NAME'}
                          </span>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '3px',
                            textAlign: 'right',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '8px',
                              color: 'rgba(255,255,255,0.45)',
                              letterSpacing: '1.5px',
                              textTransform: 'uppercase',
                            }}
                          >
                            Expires
                          </span>
                          <span
                            style={{
                              fontSize: 'clamp(10px, 2.5vw, 13px)',
                              color: '#fff',
                              letterSpacing: '2px',
                              fontWeight: 500,
                            }}
                          >
                            {cardExpiry || 'MM/YY'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Back */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility:
                          'hidden' as React.CSSProperties['WebkitBackfaceVisibility'],
                        transform: 'rotateY(180deg)',
                        borderRadius: '16px',
                        background:
                          'linear-gradient(145deg, #141414 0%, #2a2a2a 55%, #141414 100%)',
                        boxShadow:
                          '0 24px 48px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.07)',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: '100%',
                          height: '20%',
                          background: '#0a0a0a',
                          marginTop: '14%',
                        }}
                      />
                      <div
                        style={{
                          padding: '4% 7%',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '8px',
                            color: 'rgba(255,255,255,0.45)',
                            letterSpacing: '1.5px',
                            textTransform: 'uppercase',
                          }}
                        >
                          CVV
                        </span>
                        <div
                          style={{
                            background: 'rgba(255,255,255,0.93)',
                            borderRadius: '4px',
                            padding: '7px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                          }}
                        >
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontSize: '16px',
                              letterSpacing: '5px',
                              color: '#1a1a1a',
                            }}
                          >
                            {cardCvv ? '•'.repeat(cardCvv.length) : '•••'}
                          </span>
                        </div>
                      </div>
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '7%',
                          right: '7%',
                        }}
                      >
                        {cardBrand === 'mastercard' && <MastercardLogo />}
                        {cardBrand === 'visa' && (
                          <span
                            style={{
                              fontSize: '18px',
                              fontStyle: 'italic',
                              fontWeight: 900,
                              color: 'rgba(255,255,255,0.7)',
                              letterSpacing: '-1px',
                            }}
                          >
                            VISA
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card inputs */}
                <div className="flex flex-col gap-5 mt-2">
                  <div>
                    <label className={labelCls}>Card Number</label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => {
                        const raw = e.target.value
                          .replace(/\D/g, '')
                          .slice(0, 16);
                        setCardNumber(raw.replace(/(.{4})/g, '$1 ').trim());
                      }}
                      onFocus={() => setIsCardFlipped(false)}
                      className={inputCls}
                      inputMode="numeric"
                      autoComplete="cc-number"
                      autoFocus
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className={labelCls}>Expiry (MM/YY)</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => {
                          const raw = e.target.value
                            .replace(/\D/g, '')
                            .slice(0, 4);
                          setCardExpiry(
                            raw.length > 2
                              ? `${raw.slice(0, 2)}/${raw.slice(2)}`
                              : raw
                          );
                        }}
                        onFocus={() => setIsCardFlipped(false)}
                        className={inputCls}
                        inputMode="numeric"
                        autoComplete="cc-exp"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>CVV</label>
                      <input
                        type="password"
                        placeholder="•••"
                        value={cardCvv}
                        onChange={(e) =>
                          setCardCvv(
                            e.target.value.replace(/\D/g, '').slice(0, 4)
                          )
                        }
                        onFocus={() => setIsCardFlipped(true)}
                        onBlur={() => setIsCardFlipped(false)}
                        className={inputCls}
                        inputMode="numeric"
                        autoComplete="cc-csc"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Cardholder Name</label>
                    <input
                      type="text"
                      placeholder="Name on card"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      onFocus={() => setIsCardFlipped(false)}
                      className={inputCls}
                      autoComplete="cc-name"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── NET BANKING ──────────────────────────────────────── */}
            {method === 'NET_BANKING' && (
              <div className="flex flex-col gap-3">
                <label className={labelCls}>Select Bank</label>
                <div className="relative">
                  <select
                    value={bankCode}
                    onChange={(e) => setBankCode(e.target.value)}
                    className={
                      inputCls + ' appearance-none pr-6 cursor-pointer'
                    }
                  >
                    {banks.map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[11px] font-light text-[#1B1B1B]/35">
                  You will be redirected to your bank&apos;s secure page.
                </p>
              </div>
            )}

            {method === 'UPI' && (
              <div className="flex flex-col gap-3">
                <label className={labelCls} htmlFor="upi-choice">Pay with UPI</label>
                <select id="upi-choice" className={inputCls} value={upiChoice} onChange={(event) => setUpiChoice(event.target.value)}>
                  <option value="qr">Scan QR code</option>
                  {upiApps.map((app) => <option key={app.code} value={app.code}>{app.name}</option>)}
                </select>
                <p className="text-sm text-black/60">
                  {upiChoice === 'qr' ? 'Open the secure QR code and scan it using any UPI app on another device.' : 'Approve payment in your selected UPI app, then return here.'}
                </p>
                <p className="text-xs text-black/50">Your order is confirmed only after payment verification.</p>
              </div>
            )}

            {/* Pay button */}
            <button
              onClick={handleCustomPaymentSubmit}
              disabled={!isFormValid}
              className="w-full py-4 bg-black rounded-full  text-white text-[0.725rem] tracking-[1.5px] uppercase hover:opacity-80 transition-opacity duration-200 cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {method === 'UPI' && upiChoice === 'qr' ? 'Show QR code' : 'Pay'} {formatINR(cart?.estimatedTotal ?? 0)}
            </button>
          </motion.div>

          <SecurityBadge />
        </div>
      </div>
    );
  }

  // ── Main page ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <CheckoutSteps />

      {loading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2
            strokeWidth={1.5}
            className="w-5 h-5 animate-spin text-[#1B1B1B]/25"
          />
        </div>
      ) : (
        <div className="max-w-lg mx-auto w-full px-6 py-10 flex flex-col gap-6">
          {/* Error banner */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-4 border border-black/8 flex items-start gap-3"
              >
                <AlertCircle
                  strokeWidth={1.5}
                  className="w-4 h-4 shrink-0 mt-0.5 text-[#1B1B1B]/40"
                />
                <p className="text-[12.5px] font-light text-[#1B1B1B]/70">
                  {errorMsg}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Back to checkout */}
          <button
            onClick={() => router.push('/checkout')}
            className="flex items-center gap-1.5 text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/95 transition-colors duration-200 cursor-pointer self-start"
          >
            <ArrowLeft strokeWidth={1.5} className="w-3 h-3" />
            Back to Address
          </button>

          {/* Delivery address */}
          {selectedAddress && (
            <div className="border border-black/8 p-4 flex items-start gap-3">
              <div className="w-8 h-8 bg-[#1B1B1B]/4 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin
                  strokeWidth={1.5}
                  className="w-3.5 h-3.5 text-[#1B1B1B]/35"
                />
              </div>
              <div>
                <p className="text-[0.65rem] tracking-[1.5px] uppercase text-[#1B1B1B]/35 mb-1">
                  Delivering to
                </p>
                <p className="text-[13px] font-light text-[#1B1B1B]">
                  {selectedAddress.label} — {selectedAddress.street}
                </p>
                <p className="text-[12px] font-light text-[#1B1B1B]/55 mt-0.5">
                  {toCapitalCase(selectedAddress.city)},{' '}
                  {selectedAddress.postalCode}
                </p>
              </div>
            </div>
          )}

          {/* Payment method selector */}
          <div className="flex flex-col gap-2">
            <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/75 mb-2">
              Payment Method
            </p>

            {/* COD unavailable notice */}
            {isHighValue && (
              <div
                className="flex items-start gap-2.5 p-3.5 mb-1"
                style={{ background: 'rgba(27,27,27,0.03)', border: '1px solid rgba(27,27,27,0.08)' }}
              >
                <Truck strokeWidth={1.5} className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#1B1B1B]/30" />
                <p className="text-[11.5px] font-light text-[#1B1B1B]/55 leading-relaxed">
                  Cash on Delivery is not available for orders above{' '}
                  <span className="text-[#1B1B1B]/75">{formatINR(COD_LIMIT)}</span>.
                  You may pay online or reserve the piece and our team will arrange payment with you.
                </p>
              </div>
            )}

            {availableMethods.map(({ id, label, desc, icon: Icon }) => {
              const isSelected = method === id;
              const isReserveOption = id === 'RESERVE';
              return (
                <button
                  key={id}
                  onClick={() => {
                    setMethod(id);
                    setErrorMsg(null);
                  }}
                  disabled={isProcessing || onlinePending}
                  className="flex items-center gap-3 p-4 border text-left cursor-pointer transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    borderColor: isSelected ? '#1B1B1B' : 'rgba(27,27,27,0.1)',
                    borderWidth: isSelected ? '1.5px' : '1px',
                  }}
                >
                  <div
                    className="w-8 h-8 flex items-center justify-center shrink-0"
                    style={{
                      background: isSelected
                        ? '#1B1B1B'
                        : 'rgba(27,27,27,0.04)',
                    }}
                  >
                    <Icon
                      strokeWidth={1.5}
                      className="w-3.5 h-3.5"
                      style={{
                        color: isSelected ? 'white' : 'rgba(27,27,27,0.35)',
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-light text-[#1B1B1B]">
                        {label}
                      </p>
                      {isReserveOption && (
                        <span
                          className="text-[0.55rem] tracking-[1.5px] uppercase px-1.5 py-0.5"
                          style={{ background: 'rgba(27,27,27,0.06)', color: 'rgba(27,27,27,0.5)' }}
                        >
                          No payment now
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-light text-[#1B1B1B]/40">
                      {desc}
                    </p>
                  </div>
                  <div
                    className="w-4 h-4 border flex items-center justify-center shrink-0 transition-all duration-150"
                    style={{
                      borderColor: isSelected
                        ? '#1B1B1B'
                        : 'rgba(27,27,27,0.2)',
                      background: isSelected ? '#1B1B1B' : 'transparent',
                    }}
                  >
                    {isSelected && (
                      <Check
                        strokeWidth={2.5}
                        className="w-2.5 h-2.5 text-white"
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Order summary */}
          <div className="border border-black/8 p-6 flex flex-col gap-5">
            <p className="text-[0.725rem] tracking-[1.5px] uppercase text-[#1B1B1B]/75">
              Order Summary
            </p>
            <div className="flex flex-col gap-4">
              {cart?.items?.map((item) => (
                <div key={item.cartItemId} className="flex items-center gap-3">
                  <div
                    className="relative w-10 h-12 shrink-0 overflow-hidden"
                    style={{ background: '#F3EEE9' }}
                  >
                    {item.primaryImageUrl && (
                      <Image
                        fill
                        src={item.primaryImageUrl}
                        alt={item.product.name}
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-light text-[#1B1B1B] truncate">
                      {item.product.name}
                    </p>
                    <p className="text-[11px] font-light text-[#1B1B1B]/40">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <span className="text-[13px] font-light text-[#1B1B1B] shrink-0">
                    {formatINR(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>
            <div className="h-px bg-black/8" />
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-baseline">
                <p className="text-[13px] font-light text-[#1B1B1B]/75">
                  Subtotal{' '}
                  <span className="text-[#1B1B1B]/40 text-[11px]">
                    ({totalQty} {totalQty === 1 ? 'item' : 'items'})
                  </span>
                </p>
                <p className="text-[13px] font-light text-[#1B1B1B]/75">
                  {formatINR(cart?.subtotal ?? 0)}
                </p>
              </div>
              <div className="flex justify-between items-baseline">
                <p className="text-[13px] font-light text-[#1B1B1B]/70">
                  Delivery
                </p>
                <p className="text-[11px] tracking-[1px] uppercase text-[#1B1B1B]/40">
                  Free
                </p>
              </div>
              <div className="h-px bg-black/8" />
              <div className="flex justify-between items-baseline">
                <p className="text-[0.65rem] tracking-[1.5px] uppercase text-[#1B1B1B]/75">
                  Total
                </p>
                <p
                  className="font-light text-[#1B1B1B]"
                  style={{ fontSize: 'clamp(1.1rem, 2vw, 1.4rem)' }}
                >
                  {formatINR(cart?.estimatedTotal ?? 0)}
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handlePlaceOrder}
            disabled={isProcessing}
            className="w-full py-4 bg-black rounded-full  text-white text-[0.725rem] tracking-[1.5px] uppercase hover:opacity-80 transition-opacity duration-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <Loader2 strokeWidth={2} className="w-3.5 h-3.5 animate-spin" />
                {statusLabel[pageState] ?? 'Processing…'}
              </>
            ) : onlinePending ? (
              'Check payment status'
            ) : method === 'COD' ? (
              'Place Order'
            ) : method === 'RESERVE' ? (
              'Confirm Reservation'
            ) : (
              `Pay ${formatINR(cart?.estimatedTotal ?? 0)}`
            )}
          </button>

          <SecurityBadge />
        </div>
      )}
    </div>
  );
}
