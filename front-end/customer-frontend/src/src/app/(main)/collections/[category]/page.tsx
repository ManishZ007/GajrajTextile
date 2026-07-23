'use client';

import { formatSlug } from '@/provider/formateProvider/slugFormate';
import { toCapitalCase } from '@/lib/textUtils';
import { useMenuStore, MenuItem } from '@/store/menuStore';
import ProductCard from '@/components/Product/ProductCard';
import { ProductResponse } from '@/types/product';
import { ChevronRight } from 'lucide-react';
import { clientFetch } from '@/lib/clientFetch';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

export default function CategoryPage() {
  const { category } = useParams() as { category: string };
  const searchParams = useSearchParams();
  const categoryId = searchParams.get('categoryId');
  const title = formatSlug(category);
  const router = useRouter();

  const menuItem = useMenuStore((s) =>
    s.items.find((i) => i.categoryId === categoryId)
  );
  const menuLoaded = useMenuStore((s) => s.loaded);
  const fetchMenuItems = useMenuStore((s) => s.fetchItems);

  const allMenuItems = useMenuStore((s) => s.items);
  const suggestedCategories: MenuItem[] = useMemo(
    () =>
      [
        ...allMenuItems.filter(
          (i) => i.categoryId !== categoryId && i.productCount > 0
        ),
      ]
        .sort(() => Math.random() - 0.5)
        .slice(0, 2),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [categoryId, menuLoaded]
  );

  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [suggestedProducts, setSuggestedProducts] = useState<
    Record<string, ProductResponse[]>
  >({});
  // hero image own load/error state
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Boot menu store if arriving via direct URL
  useEffect(() => {
    if (!menuLoaded) fetchMenuItems();
  }, [menuLoaded, fetchMenuItems]);

  // Fetch products — waits for menu store so menuItem fields are ready
  useEffect(() => {
    if (!menuLoaded) return;

    if (!categoryId || (menuItem && menuItem.productCount === 0)) {
      setProductsLoading(false);
      return;
    }

    setProductsLoading(true);
    clientFetch(`/api/products/all?categoryId=${categoryId}`)
      .then((r) => r.json())
      .then((data) =>
        setProducts(Array.isArray(data.content) ? data.content : [])
      )
      .catch(() => setProducts([]))
      .finally(() => setProductsLoading(false));
  }, [categoryId, menuLoaded]); // intentionally excludes menuItem to avoid double-fetch

  // Reset image states when the category changes
  useEffect(() => {
    setImgLoaded(false);
    setImgError(false);
  }, [categoryId]);

  // Fetch all products for each suggested category
  useEffect(() => {
    if (!menuLoaded || suggestedCategories.length === 0) return;
    Promise.all(
      suggestedCategories.map((cat) =>
        clientFetch(`/api/products/all?categoryId=${cat.categoryId}`)
          .then((r) => r.json())
          .then((data) => ({
            id: cat.categoryId,
            products: Array.isArray(data.content) ? data.content : [],
          }))
          .catch(() => ({ id: cat.categoryId, products: [] }))
      )
    ).then((results) => {
      const map: Record<string, ProductResponse[]> = {};
      results.forEach(({ id, products }) => {
        map[id] = products;
      });
      setSuggestedProducts(map);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuLoaded, categoryId]);

  // Resolved hero content
  const heroTitle = menuItem?.baseTitle || toCapitalCase(title);
  const heroDescription =
    menuItem?.baseDescription || menuItem?.description || null;
  const heroShortDescription = menuItem?.baseShortDescription || null;
  const heroImage = !imgError ? menuItem?.baseImageUrl || null : null;

  // ── Full page spinner — only while menu hasn't loaded yet ──────────────────
  if (!menuLoaded) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  // ── No products + menu loaded ──────────────────────────────────────────────
  if (!productsLoading && products.length === 0) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center gap-3">
        <p className="text-[11px] uppercase tracking-[3px] text-black/40">
          Coming Soon
        </p>
        <h1 className="text-[28px] font-light tracking-wide text-black">
          {toCapitalCase(title)}
        </h1>
        <p className="text-[13px] text-black/50 mt-1">
          We&apos;re curating something beautiful for this collection.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white">
      {/* ── Hero section — renders immediately once menu is loaded ─────────── */}
      <div className="flex w-full pt-10 pb-6 px-4 sm:px-8 flex-col items-center text-center gap-3 text-[1.087rem] md:text-[1.3rem]">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          style={{
            // fontSize: '1.087rem',
            fontWeight: 300,
            letterSpacing: '.025rem',
            color: '#1a1a1a',
            fontFamily: 'Clamp',
          }}
        >
          {toCapitalCase(heroTitle)}
        </motion.h1>

        {heroDescription && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            style={{
              lineHeight: 1.4,
              maxWidth: '599px',
              display: 'block',
              marginBlockStart: '1em',
              marginBlockEnd: '1em',
              marginInlineStart: '0px',
              marginInlineEnd: '0px',
              unicodeBidi: 'isolate',
              fontWeight: '350',
            }}
            className="text-[.858rem] md:text-[.969rem]"
          >
            {heroDescription}
          </motion.p>
        )}
      </div>
      {/* ── Hero image — portrait on mobile, landscape on tablet/desktop ─────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="w-full"
        // style={{ background: '#ffffff' }}
      >
        {heroImage ? (
          <>
            {/* ── MOBILE: landscape image + title + description below ────────── */}
            <div className="block sm:hidden">
              <div
                className="relative w-full overflow-hidden"
                style={{ aspectRatio: '4/3' }}
              >
                {!imgLoaded && (
                  <div
                    className="absolute inset-0 z-10"
                    style={{
                      background:
                        'linear-gradient(90deg, #ede8e2 25%, #f5f0ea 50%, #ede8e2 75%)',
                      backgroundSize: '200% 100%',
                      animation: 'skeleton-shimmer 1.8s infinite',
                    }}
                  />
                )}
                <img
                  src={heroImage}
                  alt={heroTitle}
                  loading="eager"
                  onLoad={() => setImgLoaded(true)}
                  onError={() => setImgError(true)}
                  className="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700"
                  style={{ opacity: imgLoaded ? 1 : 0 }}
                />
              </div>

              {/* Short description + category name below image — mobile only */}
              {imgLoaded && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="px-5 pt-4 pb-3"
                >
                  <p
                    style={{
                      marginTop: '10px',
                      fontSize: '1rem',
                      fontWeight: 350,
                      color: '#1a1a1a',
                      // fontFamily: 'Clamp',
                      marginBottom: '10px',
                    }}
                  >
                    {toCapitalCase(formatSlug(category))}
                  </p>
                  {heroShortDescription && (
                    <p
                      style={{
                        // fontSize: '0.85rem',
                        lineHeight: 1.4,
                        color: '#373737',
                        fontWeight: 330,
                        // fontFamily: 'Clamp',
                      }}
                      className="text-[.888rem]"
                    >
                      {heroShortDescription}
                    </p>
                  )}
                </motion.div>
              )}
            </div>

            {/* ── TABLET / DESKTOP: landscape with overlay text ─────────────── */}
            <div
              className="hidden sm:block relative w-full overflow-hidden"
              style={{ maxHeight: '90vh' }}
            >
              {/* Shimmer */}
              {!imgLoaded && (
                <div
                  className="absolute inset-0 z-10"
                  style={{
                    minHeight: '50vw',
                    backgroundSize: '200% 100%',
                    animation: 'skeleton-shimmer 1.8s infinite',
                  }}
                />
              )}
              <img
                src={heroImage}
                alt={heroTitle}
                loading="eager"
                className="w-full h-auto block object-cover transition-opacity duration-700"
                style={{
                  maxHeight: '90vh',
                  objectPosition: 'center',
                  opacity: imgLoaded ? 1 : 0,
                }}
              />

              {/* Short description overlay — bottom-left, desktop/tablet only */}
              {heroShortDescription && imgLoaded && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute bottom-0 left-0 p-8 mx-3 my-3"
                  style={{
                    maxWidth: 'min(460px, 55%)',
                    background: 'rgba(101, 101, 101, 0.04)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(18px)',
                    border: '.5px solid rgba(101, 101, 101, 0.04)',
                    borderRadius: '18px',
                    zIndex: 10,
                  }}
                >
                  <p
                    style={{
                      // marginTop: '1px',
                      fontSize: '1rem',
                      fontWeight: 350,
                      color: '#ffffff',
                      // fontFamily: 'Clamp',
                      marginBottom: '10px',
                    }}
                  >
                    {toCapitalCase(formatSlug(category + ' ' + 'Collection'))}
                  </p>
                  <p
                    style={{
                      fontSize: 'clamp(0.8rem, 1.4vw, .9rem)',
                      lineHeight: 1.85,
                      letterSpacing: '.8px',
                      color: 'rgb(255, 255, 255)',
                      fontWeight: 300,
                      // fontFamily: 'Clamp',
                    }}
                    className="text-[.948rem]"
                  >
                    {heroShortDescription}
                  </p>
                </motion.div>
              )}
            </div>
          </>
        ) : (
          <div style={{ height: '1px', background: 'rgba(0,0,0,0.07)' }} />
        )}
      </motion.div>
      {/* ── Products grid ──────────────────────────────────────────────────── */}
      <div className="px-3 sm:px-6 lg:px-10 py-7 sm:py-12">
        {productsLoading ? (
          // Skeleton grid while products load
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '12px',
            }}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                style={{
                  borderRadius: '22px',
                  background:
                    'linear-gradient(90deg, #ede8e2 25%, #f5f0ea 50%, #ede8e2 75%)',
                  backgroundSize: '200% 100%',
                  animation: `skeleton-shimmer 1.6s infinite`,
                  animationDelay: `${i * 0.07}s`,
                }}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] md:grid-cols-[repeat(auto-fill,280px)] gap-3">
            {products.map((product) => (
              <ProductCard
                key={product.productId}
                product={product}
                onExplore={(id) => router.push(`/product/detail/${id}`)}
                onCustomize={(id) => router.push(`/product/${id}/customize`)}
              />
            ))}
          </div>
        )}
      </div>
      {/* ── Suggested categories ───────────────────────────────────────────── */}
      {suggestedCategories.length > 0 && (
        <div className="px-4 sm:px-6 lg:px-10 pb-16 pt-2 text-[0.7rem] md:text-[0.8rem]">
          <p
            style={{
              // fontSize: '0.8rem',
              letterSpacing: '2.5px',
              textTransform: 'uppercase',
              color: 'rgba(0, 0, 0, 0.539)',
              marginBottom: '22px',
              // fontFamily: 'Clamp',
            }}
          >
            Explore More
          </p>

          <div className="flex flex-col gap-11">
            {suggestedCategories.map((cat) => {
              const slug = cat.name.toLowerCase().replace(/\s+/g, '-');
              const catProducts = suggestedProducts[cat.categoryId];
              const isLoading = !catProducts;

              return (
                <div key={cat.categoryId}>
                  {/* Title + See all — same on mobile and desktop */}
                  <div className="flex items-center justify-between mb-3">
                    <h3
                      style={{
                        fontSize: '1rem',
                        fontWeight: 300,
                        color: '#1a1a1a',
                        // fontFamily: 'Clamp',
                      }}
                    >
                      {toCapitalCase(cat.baseTitle || cat.name)}
                    </h3>
                    <button
                      onClick={() =>
                        router.push(
                          `/collections/${slug}?categoryId=${cat.categoryId}`
                        )
                      }
                      className="flex items-center gap-1"
                      style={{
                        fontSize: '0.75rem',
                        color: 'rgba(0,0,0,0.45)',
                        // fontFamily: 'Clamp',
                        fontWeight: 400,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      See all <ChevronRight size={13} strokeWidth={1.5} />
                    </button>
                  </div>

                  {/* Horizontal scroll of ProductCards */}
                  <div
                    className="flex overflow-x-auto gap-3 pb-1"
                    style={{ scrollbarWidth: 'none' }}
                  >
                    {isLoading
                      ? Array.from({ length: 4 }).map((_, i) => (
                          <div
                            key={i}
                            className="shrink-0 h-70 md:h-110"
                            style={{
                              width: '140px',
                              borderRadius: '22px',
                              background:
                                'linear-gradient(90deg, #ede8e2 25%, #f5f0ea 50%, #ede8e2 75%)',
                              backgroundSize: '200% 100%',
                              animation: `skeleton-shimmer 1.6s ${i * 0.1}s infinite`,
                            }}
                          />
                        ))
                      : catProducts.map((p) => (
                          <div
                            key={p.productId}
                            className="shrink-0 w-44 md:w-70"
                          >
                            <ProductCard
                              product={p}
                              onExplore={(id) =>
                                router.push(`/product/detail/${id}`)
                              }
                              onCustomize={(id) =>
                                router.push(`/product/${id}/customize`)
                              }
                            />
                          </div>
                        ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
