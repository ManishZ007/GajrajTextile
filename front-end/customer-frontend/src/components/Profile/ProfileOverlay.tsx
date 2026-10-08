'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { X, LogOut, LogIn, UserPlus } from 'lucide-react';
import { clientFetch } from '@/lib/clientFetch';
import Image from 'next/image';
import type { WishlistItem } from '@/types/wishlist';
import type { Address } from '@/types/customer';
import { toCapitalCase } from '@/lib/textUtils';

type ProfileOrder = {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  orderDate: string;
  totalAmount: number;
};

type OrderListResponse = {
  content: ProfileOrder[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
};

const ORDER_PAGE_SIZE = 3;
const orderCurrency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

type ProfileOverlayProps = {
  onClose: () => void;
};

const TABS = ['Overview', 'My Profile', 'My Orders', 'My Wishlist'] as const;
type Tab = (typeof TABS)[number];

const overlayVariants = {
  hidden: { opacity: 0, y: -12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
  },
};

export const ProfileOverlay = ({
  onClose,
}: ProfileOverlayProps): React.JSX.Element => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [ordersRetry, setOrdersRetry] = useState(0);
  const [wishlistRetry, setWishlistRetry] = useState(0);
  const [addressesRetry, setAddressesRetry] = useState(0);
  const [addressesResult, setAddressesResult] = useState<{
    key: string;
    items: Address[];
    error: string | null;
  } | null>(null);
  const [wishlistResult, setWishlistResult] = useState<{
    key: string;
    items: WishlistItem[];
    error: string | null;
  } | null>(null);
  const [ordersResult, setOrdersResult] = useState<{
    key: string;
    data: OrderListResponse | null;
    error: string | null;
  } | null>(null);

  const isLoggedIn = status === 'authenticated' && !!session;
  const isLoading = status === 'loading';
  const userName = session?.user?.name ?? 'User';
  const userEmail = session?.user?.email ?? '';
  const ordersRequestKey = JSON.stringify([userEmail, ordersRetry]);
  const currentOrdersResult =
    ordersResult?.key === ordersRequestKey ? ordersResult : null;
  const ordersLoading = currentOrdersResult === null;
  const ordersError = currentOrdersResult?.error;
  const ordersData = currentOrdersResult?.data;
  const orders = ordersData?.content ?? [];
  const wishlistRequestKey = JSON.stringify([userEmail, wishlistRetry]);
  const currentWishlistResult =
    wishlistResult?.key === wishlistRequestKey ? wishlistResult : null;
  const wishlistLoading = currentWishlistResult === null;
  const wishlistError = currentWishlistResult?.error;
  const wishlistItems = currentWishlistResult?.items ?? [];
  const addressesRequestKey = JSON.stringify([userEmail, addressesRetry]);
  const currentAddressesResult =
    addressesResult?.key === addressesRequestKey ? addressesResult : null;
  const addressesLoading = currentAddressesResult === null;
  const addressesError = currentAddressesResult?.error;
  const addresses = currentAddressesResult?.items ?? [];

  useEffect(() => {
    if (!isLoggedIn) return;
    const controller = new AbortController();

    const loadAddresses = async () => {
      try {
        const response = await clientFetch('/api/customer/address', {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Failed to load addresses');
        const items: Address[] = await response.json();
        if (!Array.isArray(items))
          throw new Error('Invalid addresses response');
        if (!controller.signal.aborted) {
          setAddressesResult({ key: addressesRequestKey, items, error: null });
        }
      } catch {
        if (!controller.signal.aborted) {
          setAddressesResult({
            key: addressesRequestKey,
            items: [],
            error: 'Could not load your addresses. Please try again.',
          });
        }
      }
    };

    void loadAddresses();
    return () => controller.abort();
  }, [isLoggedIn, addressesRequestKey]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const controller = new AbortController();

    const loadWishlist = async () => {
      try {
        const response = await clientFetch('/api/wishlist', {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Failed to load wishlist');
        const items: WishlistItem[] = await response.json();
        if (!Array.isArray(items)) throw new Error('Invalid wishlist response');
        if (!controller.signal.aborted) {
          setWishlistResult({ key: wishlistRequestKey, items, error: null });
        }
      } catch {
        if (!controller.signal.aborted) {
          setWishlistResult({
            key: wishlistRequestKey,
            items: [],
            error: 'Could not load your wishlist. Please try again.',
          });
        }
      }
    };

    void loadWishlist();
    return () => controller.abort();
  }, [isLoggedIn, wishlistRequestKey]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const controller = new AbortController();

    const loadOrders = async () => {
      try {
        const response = await clientFetch(
          `/api/orders?page=0&size=${ORDER_PAGE_SIZE}`,
          { signal: controller.signal }
        );
        if (!response.ok) throw new Error('Failed to load orders');
        const data: OrderListResponse = await response.json();
        if (!Array.isArray(data.content))
          throw new Error('Invalid orders response');
        if (!controller.signal.aborted) {
          setOrdersResult({ key: ordersRequestKey, data, error: null });
        }
      } catch {
        if (!controller.signal.aborted) {
          setOrdersResult({
            key: ordersRequestKey,
            data: null,
            error: 'Could not load your orders. Please try again.',
          });
        }
      }
    };

    void loadOrders();
    return () => controller.abort();
  }, [isLoggedIn, ordersRequestKey]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleNavigate = (href: string) => {
    router.push(href);
    onClose();
  };

  const handleSignOut = async () => {
    onClose();
    await signOut({ callbackUrl: '/' });
  };

  const renderOrders = (compact: boolean) => {
    if (ordersLoading) {
      return (
        <p role="status" className="text-[13px] font-light text-[#1B1B1B]/55">
          Loading your orders...
        </p>
      );
    }
    if (ordersError) {
      return (
        <div role="alert" className="flex flex-col items-start gap-3">
          <p className="text-[13px] font-light text-[#1B1B1B]/70">
            {ordersError}
          </p>
          <button
            onClick={() => setOrdersRetry((value) => value + 1)}
            className="cursor-pointer text-[0.7rem] tracking-[1.5px] uppercase text-[#1B1B1B]/70 hover:text-[#1B1B1B] underline underline-offset-4"
          >
            Retry
          </button>
        </div>
      );
    }
    if (orders.length === 0) {
      return (
        <div className="flex flex-col items-start gap-5">
          <p className="text-[13px] font-light text-[#1B1B1B]/55">
            There are no current orders
          </p>
          <button
            onClick={() => handleNavigate('/collections')}
            className="px-8 py-3.5 text-[0.7rem] tracking-[2px] uppercase text-white bg-black rounded-full  hover:opacity-80 transition-opacity duration-200 cursor-pointer"
          >
            Start Shopping
          </button>
        </div>
      );
    }
    return (
      <div>
        <p className="mb-3 text-[12px] font-light text-[#1B1B1B]/55">
          {ordersData?.totalElements ?? orders.length} order
          {ordersData?.totalElements === 1 ? '' : 's'} placed
        </p>
        <ul className="divide-y divide-black/8">
          {orders.slice(0, compact ? 2 : 3).map((order) => (
            <li key={order.orderId}>
              <button
                onClick={() => handleNavigate(`/orders/${order.orderId}`)}
                aria-label={`View order ${order.orderNumber}`}
                className="flex w-full flex-wrap items-center justify-between gap-3 py-4 text-left cursor-pointer hover:bg-[#1B1B1B]/[0.03] focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#1B1B1B]/55 transition-colors"
              >
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="text-[13.5px] font-light text-[#1B1B1B] break-all">
                    {order.orderNumber}
                  </span>
                  <span className="text-[12px] font-light text-[#1B1B1B]/55">
                    {order.orderDate
                      ? new Date(order.orderDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </span>
                </span>
                <span className="flex flex-col items-end gap-2">
                  <span className="text-[14px] font-light text-[#1B1B1B]">
                    {orderCurrency.format(order.totalAmount)}
                  </span>
                  <span className="border border-black/45 px-2.5 py-0.5 text-[0.65rem] tracking-[1.5px] uppercase text-[#1B1B1B]/75">
                    {order.orderStatus.replace(/_/g, ' ')}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        {compact ? (
          <button
            onClick={() => setActiveTab('My Orders')}
            className="mt-5 w-full py-3.5 text-[0.7rem] tracking-[2px] uppercase text-white bg-black rounded-full  hover:opacity-80 transition-opacity duration-200 cursor-pointer"
          >
            View My Orders
          </button>
        ) : (
          <button
            onClick={() => handleNavigate('/orders')}
            className="mt-6 px-8 py-3.5 text-[0.7rem] tracking-[2px] uppercase text-white bg-black rounded-full  hover:opacity-80 transition-opacity duration-200 cursor-pointer"
          >
            View More
          </button>
        )}
      </div>
    );
  };

  const renderWishlist = (compact: boolean) => {
    if (wishlistLoading) {
      return (
        <p role="status" className="text-[13px] font-light text-[#1B1B1B]/55">
          Loading your wishlist...
        </p>
      );
    }
    if (wishlistError) {
      return (
        <div role="alert" className="flex flex-col items-start gap-3">
          <p className="text-[13px] font-light text-[#1B1B1B]/70">
            {wishlistError}
          </p>
          <button
            onClick={() => setWishlistRetry((value) => value + 1)}
            className="cursor-pointer text-[0.7rem] tracking-[1.5px] uppercase text-[#1B1B1B]/70 hover:text-[#1B1B1B] underline underline-offset-4"
          >
            Retry
          </button>
        </div>
      );
    }
    if (wishlistItems.length === 0) {
      return (
        <div className="flex flex-col items-start gap-5">
          <p className="text-[13px] font-light text-[#1B1B1B]/55">
            Your wishlist is empty
          </p>
          <button
            onClick={() => handleNavigate('/collections')}
            className="px-8 py-3.5 text-[0.7rem] tracking-[2px] uppercase text-white bg-black rounded-full  hover:opacity-80 transition-opacity duration-200 cursor-pointer"
          >
            Browse Collections
          </button>
        </div>
      );
    }
    return (
      <div>
        <p className="mb-3 text-[12px] font-light text-[#1B1B1B]/55">
          {wishlistItems.length} saved item
          {wishlistItems.length === 1 ? '' : 's'}
        </p>
        <ul className="divide-y divide-black/8">
          {wishlistItems.slice(0, compact ? 2 : 3).map((item) => (
            <li key={item.wishlistId}>
              <button
                onClick={() =>
                  handleNavigate(`/product/detail/${item.productId}`)
                }
                aria-label={`View ${item.productName}`}
                className="flex w-full items-center gap-4 py-4 text-left cursor-pointer hover:bg-[#1B1B1B]/[0.03] focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#1B1B1B]/55 transition-colors"
              >
                <span className="relative flex h-20 w-16 shrink-0 items-center justify-center overflow-hidden bg-[#1B1B1B]/4">
                  {item.primaryImage ? (
                    <Image
                      src={item.primaryImage}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-center text-[10px] text-[#1B1B1B]/45">
                      No image
                    </span>
                  )}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className="text-[0.65rem] tracking-[1.5px] uppercase text-[#1B1B1B]/55">
                    {item.categoryName}
                  </span>
                  <span className="text-[13.5px] font-light text-[#1B1B1B] wrap-break-word">
                    {item.productName}
                  </span>
                  <span className="text-[14px] font-light text-[#1B1B1B]">
                    {orderCurrency.format(item.basePrice)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <button
          onClick={() =>
            compact ? setActiveTab('My Wishlist') : handleNavigate('/wishlist')
          }
          className={`${compact ? 'mt-5 w-full' : 'mt-6 px-8'} py-3.5 text-[0.7rem] tracking-[2px] uppercase text-white bg-black rounded-full  hover:opacity-80 transition-opacity duration-200 cursor-pointer`}
        >
          {compact ? 'View My Wishlist' : 'View More'}
        </button>
      </div>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        key="profile-overlay-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        className="fixed inset-0 z-[39]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Full-screen overlay — starts below Navbar via padding */}
      <motion.div
        key="profile-overlay"
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 z-40 bg-white pt-15 md:pt-18 flex flex-col overflow-hidden"
        aria-label="Account menu"
      >
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-5 h-5 border border-black/20 border-t-black/60 rounded-full animate-spin" />
          </div>
        ) : isLoggedIn ? (
          <>
            {/* ── Tab navigation ── */}
            <div className="border-b border-black/8 px-8 md:px-16 flex items-center gap-8 overflow-x-auto shrink-0">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="relative py-4 text-[0.725rem] tracking-[1.5px] uppercase whitespace-nowrap transition-colors duration-200 cursor-pointer"
                  style={{
                    color:
                      activeTab === tab ? '#1B1B1B' : 'rgba(27,27,27,0.35)',
                  }}
                >
                  {tab}
                  {activeTab === tab && (
                    <motion.div
                      layoutId="profile-tab-underline"
                      className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#1B1B1B]"
                    />
                  )}
                </button>
              ))}

              {/* Close button — lives in the tab row, perfectly centered */}
              <button
                onClick={onClose}
                className="ml-auto shrink-0 p-2 cursor-pointer text-[#1B1B1B] transition-opacity duration-200 hover:opacity-40"
                aria-label="Close account menu"
              >
                <X strokeWidth={1} className="w-5 h-5" />
              </button>
            </div>

            {/* ── User name ── */}
            <div className="px-8 md:px-16 py-8 border-b border-black/8 shrink-0">
              <p
                className="font-light text-[#1B1B1B]"
                style={{ fontSize: 'clamp(1.1rem, 1.8vw, 1.5rem)' }}
              >
                {userName}
              </p>
            </div>

            {/* ── Cards grid ── */}
            <div className="flex-1 overflow-y-auto px-8 md:px-16 py-8">
              <AnimatePresence mode="wait">
                {activeTab === 'Overview' && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-px bg-black/8"
                  >
                    {/* My Profile */}
                    <div className="bg-white p-8 flex flex-col gap-5">
                      <p
                        className="font-light text-[#1B1B1B]"
                        style={{ fontSize: 'clamp(1rem, 1.4vw, 1.25rem)' }}
                      >
                        My Profile
                      </p>
                      <div className="border-t border-black/8" />
                      <p
                        className="text-[0.725rem] tracking-[0.5px]"
                        style={{ color: 'rgba(27,27,27,0.45)' }}
                      >
                        Login:{' '}
                        <span style={{ color: '#1B1B1B' }}>{userEmail}</span>
                      </p>
                      <button
                        onClick={() => handleNavigate('/profile')}
                        className="w-full py-3.5 text-[0.7rem] tracking-[2px] uppercase text-white bg-black rounded-full  transition-opacity duration-200 hover:opacity-80 cursor-pointer"
                      >
                        Edit My Profile
                      </button>
                    </div>

                    {/* My Orders */}
                    <div className="bg-white p-8 flex flex-col gap-5">
                      <p
                        className="font-light text-[#1B1B1B]"
                        style={{ fontSize: 'clamp(1rem, 1.4vw, 1.25rem)' }}
                      >
                        My Orders
                      </p>
                      <div className="border-t border-black/8" />
                      {renderOrders(true)}
                    </div>

                    {/* My Wishlist */}
                    <div className="bg-white p-8 flex flex-col gap-5">
                      <p
                        className="font-light text-[#1B1B1B]"
                        style={{ fontSize: 'clamp(1rem, 1.4vw, 1.25rem)' }}
                      >
                        My Wishlist
                      </p>
                      <div className="border-t border-black/8" />
                      {renderWishlist(true)}
                    </div>

                    {/* My Addresses */}
                    <div className="bg-white p-8 flex flex-col gap-5">
                      <p
                        className="font-light text-[#1B1B1B]"
                        style={{ fontSize: 'clamp(1rem, 1.4vw, 1.25rem)' }}
                      >
                        My Addresses
                      </p>
                      <div className="border-t border-black/8" />
                      {addressesLoading ? (
                        <p
                          role="status"
                          className="text-[13px] font-light text-[#1B1B1B]/55"
                        >
                          Loading your addresses...
                        </p>
                      ) : addressesError ? (
                        <div
                          role="alert"
                          className="flex flex-col items-start gap-3"
                        >
                          <p className="text-[13px] font-light text-[#1B1B1B]/70">
                            {addressesError}
                          </p>
                          <button
                            onClick={() =>
                              setAddressesRetry((value) => value + 1)
                            }
                            className="cursor-pointer text-[0.7rem] tracking-[1.5px] uppercase text-[#1B1B1B]/70 hover:text-[#1B1B1B] underline underline-offset-4"
                          >
                            Retry
                          </button>
                        </div>
                      ) : addresses.length === 0 ? (
                        <p className="text-[13px] font-light text-[#1B1B1B]/55">
                          No saved addresses
                        </p>
                      ) : (
                        <div>
                          <p className="mb-3 text-[12px] font-light text-[#1B1B1B]/55">
                            {addresses.length} saved address
                            {addresses.length === 1 ? '' : 'es'}
                          </p>
                          <ul className="divide-y divide-black/8">
                            {[...addresses]
                              .sort(
                                (a, b) =>
                                  Number(b.isDefault) - Number(a.isDefault)
                              )
                              .slice(0, 2)
                              .map((address) => (
                                <li key={address.id} className="py-4">
                                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                    <span className="text-[0.7rem] tracking-[1.5px] uppercase text-[#1B1B1B]">
                                      {address.label}
                                    </span>
                                    {address.isDefault && (
                                      <span className="border border-black/45 px-2 py-0.5 text-[0.6rem] tracking-[1px] uppercase text-[#1B1B1B]/70">
                                        Default
                                      </span>
                                    )}
                                  </div>
                                  <address className="text-[13px] font-light not-italic leading-relaxed text-[#1B1B1B]/75 wrap-break-word">
                                    <p className="text-[#1B1B1B]">
                                      {address.street}
                                    </p>
                                    <p>
                                      {toCapitalCase(address.city)},{' '}
                                      {toCapitalCase(address.state)} —{' '}
                                      {address.postalCode}
                                    </p>
                                    <p>{toCapitalCase(address.country)}</p>
                                  </address>
                                </li>
                              ))}
                          </ul>
                        </div>
                      )}
                      <button
                        onClick={() => handleNavigate('/profile')}
                        className="w-full py-3.5 text-[0.7rem] tracking-[2px] uppercase text-white bg-black rounded-full  hover:opacity-80 transition-opacity duration-200 cursor-pointer"
                      >
                        View More
                      </button>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'My Profile' && (
                  <motion.div
                    key="my-profile"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="max-w-lg"
                  >
                    <p
                      className="text-[0.725rem] tracking-[1.5px] uppercase mb-6"
                      style={{ color: 'rgba(27,27,27,0.969)' }}
                    >
                      Profile Details
                    </p>
                    <div
                      className="flex flex-col gap-4 text-[0.85rem] font-light"
                      style={{ color: 'rgba(27,27,27,0.65)' }}
                    >
                      <div className="flex gap-3">
                        <span style={{ color: 'rgba(27,27,27,0.40)' }}>
                          Name
                        </span>
                        <span style={{ color: '#1B1B1B' }}>{userName}</span>
                      </div>
                      <div className="flex gap-3">
                        <span style={{ color: 'rgba(27,27,27,0.40)' }}>
                          Email
                        </span>
                        <span style={{ color: '#1B1B1B' }}>{userEmail}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleNavigate('/profile')}
                      className="mt-8 px-8 py-3.5 text-[0.7rem] tracking-[2px] uppercase text-white bg-black rounded-full  transition-opacity duration-200 hover:opacity-80 cursor-pointer"
                    >
                      Edit Profile
                    </button>
                  </motion.div>
                )}

                {activeTab === 'My Orders' && (
                  <motion.div
                    key="my-orders"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p
                      className="text-[0.725rem] tracking-[1.5px] uppercase mb-6"
                      style={{ color: 'rgba(27,27,27,0.969)' }}
                    >
                      Orders
                    </p>
                    {renderOrders(false)}
                  </motion.div>
                )}

                {activeTab === 'My Wishlist' && (
                  <motion.div
                    key="my-wishlist"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p
                      className="text-[0.725rem] tracking-[1.5px] uppercase mb-6"
                      style={{ color: 'rgba(27,27,27,0.969)' }}
                    >
                      Wishlist
                    </p>
                    {renderWishlist(false)}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Sign out */}
              <div className="mt-10 pt-8 border-t border-black/8">
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 transition-all duration-200 cursor-pointer"
                  style={{ color: 'rgba(27,27,27,0.35)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#dc2626';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'rgba(27,27,27,0.35)';
                  }}
                >
                  <LogOut strokeWidth={1} className="w-4 h-4" />
                  <span className="text-[0.7rem] tracking-[2px] uppercase font-light">
                    Sign Out
                  </span>
                </button>
              </div>
            </div>
          </>
        ) : (
          /* ── Guest state ── */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Close button row — matches logged-in tab bar height */}
            <div className="border-b border-black/8 px-8 md:px-16 flex items-center justify-end shrink-0">
              <button
                onClick={onClose}
                className="py-4 p-2 cursor-pointer text-[#1B1B1B] transition-opacity duration-200 hover:opacity-40"
                aria-label="Close account menu"
              >
                <X strokeWidth={1} className="w-5 h-5" />
              </button>
            </div>
          <div className="flex-1 flex flex-col px-8 md:px-16 pt-12 overflow-y-auto">
            <p
              className="text-[0.725rem] tracking-[1.5px] uppercase mb-10"
              style={{ color: 'rgba(27,27,27,0.969)' }}
            >
              Account
            </p>
            <p
              className="font-light text-[#1B1B1B] mb-2"
              style={{ fontSize: 'clamp(1.1rem, 1.8vw, 1.5rem)' }}
            >
              Welcome
            </p>
            <p
              className="text-[0.85rem] font-light mb-10"
              style={{ color: 'rgba(27,27,27,0.45)' }}
            >
              Sign in to access your profile, orders and wishlist
            </p>
            <div className="flex flex-col gap-3 max-w-[260px]">
              <button
                onClick={() => handleNavigate('/login')}
                className="flex items-center justify-center gap-2.5 py-3.5 text-[0.7rem] tracking-[2px] uppercase font-light transition-opacity duration-200 cursor-pointer hover:opacity-70"
                style={{ background: '#1B1B1B', color: '#ffffff' }}
              >
                <LogIn strokeWidth={1} className="w-3.5 h-3.5" />
                Sign In
              </button>
              <button
                onClick={() => handleNavigate('/register')}
                className="flex items-center justify-center gap-2.5 py-3.5 text-[0.7rem] tracking-[2px] uppercase font-light transition-opacity duration-200 cursor-pointer hover:opacity-70"
                style={{
                  border: '1px solid rgba(27,27,27,0.20)',
                  color: '#1B1B1B',
                }}
              >
                <UserPlus strokeWidth={1} className="w-3.5 h-3.5" />
                Create Account
              </button>
            </div>
          </div>
          </div>
        )}
      </motion.div>
    </>
  );
};
