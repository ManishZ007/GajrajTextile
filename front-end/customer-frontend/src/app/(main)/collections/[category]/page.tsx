'use client';

import { formatSlug } from '@/provider/formateProvider/slugFormate';
import { toCapitalCase, toTitleCase } from '@/lib/textUtils';
import Image from 'next/image';
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
  const [selectedPadar, setSelectedPadar] = useState<string>('all');

  // Unique PadarType values extracted from loaded products
  const padarTypes: { value: string; image: string }[] = useMemo(() => {
    const seen = new Set<string>();
    const result: { value: string; image: string }[] = [];
    for (const p of products) {
      const attr = p.attributes?.find((a) => a.attributeKey === 'PadarType');
      if (attr && !seen.has(attr.attributeValue)) {
        seen.add(attr.attributeValue);
        result.push({ value: attr.attributeValue, image: p.primaryImage });
      }
    }
    return result;
  }, [products]);

  // Products filtered by selected padar type
  const filteredProducts = useMemo(() => {
    if (selectedPadar === 'all') return products;
    return products.filter((p) =>
      p.attributes?.some(
        (a) =>
          a.attributeKey === 'PadarType' && a.attributeValue === selectedPadar
      )
    );
  }, [products, selectedPadar]);
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
      .then((data) => {
        const list = Array.isArray(data.content) ? data.content : [];
        console.log(
          '[collection] first product attributes:',
          list[0]?.attributes
        );
        setProducts(list);
      })

      .catch(() => setProducts([]))
      .finally(() => setProductsLoading(false));
    console.log(products);
  }, [categoryId, menuLoaded]); // intentionally excludes menuItem to avoid double-fetch
  console.log(products);

  // Reset image + filter states when the category changes
  useEffect(() => {
    setImgLoaded(false);
    setImgError(false);
    setSelectedPadar('all');
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

  const padarFilters = (
    <div
      className="flex gap-3 sm:gap-10 lg:gap-3 px-3 pt-6 pb-3 sm:pt-3 sm:pb-10 overflow-x-auto [&>*:first-child]:ml-auto [&>*:last-child]:mr-auto"
      style={{ scrollbarWidth: 'none' }}
    >
      {/* Skeleton while loading */}
      {productsLoading &&
        Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2.5 shrink-0">
            <div
              className="w-14 h-14 sm:w-20 sm:h-20 rounded-full"
              style={{
                background:
                  'linear-gradient(90deg, #ede8e2 25%, #f5f0ea 50%, #ede8e2 75%)',
                backgroundSize: '200% 100%',
                animation: `skeleton-shimmer 1.6s ${i * 0.1}s infinite`,
              }}
            />
            <div
              className="h-2 w-12 rounded"
              style={{
                background:
                  'linear-gradient(90deg, #ede8e2 25%, #f5f0ea 50%, #ede8e2 75%)',
                backgroundSize: '200% 100%',
                animation: `skeleton-shimmer 1.6s ${i * 0.1}s infinite`,
              }}
            />
          </div>
        ))}

      {/* "All" circle */}
      {!productsLoading && (
        <button
          onClick={() => setSelectedPadar('all')}
          className="group flex w-16 sm:w-24 flex-col items-center gap-4 shrink-0 cursor-pointer"
        >
          <span
            className="w-14 h-14 sm:w-20 sm:h-20 rounded-full overflow-hidden relative transition-all duration-500 ease-out group-hover:-translate-y-1 group-hover:shadow-[0_8px_20px_rgba(91,65,35,0.16)] group-focus-visible:-translate-y-1 motion-reduce:transform-none motion-reduce:transition-none"
            style={{
              background: '#f3f1ee',
            }}
          >
            <Image
              src="/images/logo-in-jpeg/logo-mark.jpeg"
              alt="All"
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-110 group-focus-visible:scale-110 motion-reduce:transform-none motion-reduce:transition-none"
              sizes="80px"
            />
          </span>
          <span
            className="w-full text-[0.9375rem] font-light tracking-normal text-center leading-[1.45] transition-colors duration-200"
            style={{
              color: selectedPadar === 'all' ? '#1B1B1B' : '#666666',
            }}
          >
            All
          </span>
        </button>
      )}

      {/* PadarType circles */}
      {!productsLoading &&
        padarTypes.map(({ value, image }) => (
          <button
            key={value}
            onClick={() => setSelectedPadar(value)}
            className="group flex w-16 sm:w-24 flex-col items-center gap-4 shrink-0 cursor-pointer"
          >
            <span className="w-14 h-14 sm:w-20 sm:h-20 rounded-full overflow-hidden relative transition-all duration-500 ease-out group-hover:-translate-y-1 group-hover:shadow-[0_8px_20px_rgba(91,65,35,0.16)] group-focus-visible:-translate-y-1 motion-reduce:transform-none motion-reduce:transition-none">
              {image ? (
                <Image
                  src={image}
                  alt={value}
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-110 group-focus-visible:scale-110 motion-reduce:transform-none motion-reduce:transition-none"
                  sizes="80px"
                />
              ) : (
                <span className="w-full h-full bg-[#f3f1ee] flex items-center justify-center text-[0.55rem] tracking-wide uppercase text-black/40">
                  {value.charAt(0)}
                </span>
              )}
            </span>
            <span
              className="w-full text-[0.9375rem] font-light tracking-normal text-center leading-[1.45] break-words transition-colors duration-200"
              style={{
                color: selectedPadar === value ? '#1B1B1B' : '#666666',
              }}
            >
              {value}
            </span>
          </button>
        ))}
    </div>
  );

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
      {/* ── Hero text section ─────────────────────────────────────────────── */}
      <div className="flex w-full flex-col items-center px-6 pt-12 pb-10 text-center sm:px-12 sm:pt-20 sm:pb-16 lg:pt-24 lg:pb-10">
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            fontSize: 'clamp(1.25rem, 1.5vw, 1.5rem)',
            fontWeight: 400,
            lineHeight: 1.4,
            letterSpacing: '0.01em',
            color: '#1a1a1a',
          }}
        >
          {toTitleCase(heroTitle)}
        </motion.h1>

        {heroDescription && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            style={{
              fontSize: 'clamp(0.875rem, 1.1vw, 1rem)',
              lineHeight: 1.65,
              maxWidth: '640px',
              fontWeight: 300,
              color: '#666666',
              marginTop: '1.25rem',
              letterSpacing: '0.01em',
            }}
          >
            {heroDescription}
          </motion.p>
        )}
      </div>
      {/* ── Padar type filter circles ─────────────────────────────────────── */}
      <div className={heroImage ? 'hidden sm:block' : ''}>{padarFilters}</div>

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
                <Image
                  fill
                  src={heroImage}
                  alt={heroTitle}
                  priority
                  onLoad={() => setImgLoaded(true)}
                  onError={() => setImgError(true)}
                  className="object-cover object-center transition-opacity duration-700"
                  style={{ opacity: imgLoaded ? 1 : 0 }}
                />
              </div>

              {padarFilters}

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
                        color: '#3737370',
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
              <Image
                src={heroImage}
                alt={heroTitle}
                priority
                width={0}
                height={0}
                sizes="100vw"
                className="w-full h-auto block object-cover transition-opacity duration-700"
                style={{
                  maxHeight: '90vh',
                  objectPosition: 'center',
                  opacity: imgLoaded ? 1 : 0,
                }}
              />

              {heroShortDescription && imgLoaded && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to top, rgba(30, 8, 5, 0.72) 0%, rgba(30, 8, 5, 0.35) 28%, transparent 60%)',
                  }}
                />
              )}

              {/* Category and short description centered near the bottom of the image */}
              {heroShortDescription && imgLoaded && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute bottom-[8%] left-1/2 -translate-x-1/2 w-full px-8"
                  style={{ maxWidth: '960px', zIndex: 10 }}
                >
                  <div className="text-center">
                    <p
                      style={{
                        fontSize: 'clamp(1.2rem, 3vw, 2.1rem)',
                        fontWeight: 400,
                        color: '#FFF8F0',
                        lineHeight: 1.2,
                        letterSpacing: '0.01em',
                        marginBottom: '20px',
                      }}
                    >
                      {formatSlug(category)} Collection
                    </p>
                    <p
                      style={{
                        fontSize: 'clamp(0.9rem, 1.2vw, 1.2rem)',
                        lineHeight: 1.55,
                        color: '#F0E2D6',
                        fontWeight: 400,
                        maxWidth: '660px',
                        marginInline: 'auto',
                      }}
                    >
                      {heroShortDescription}
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </>
        ) : (
          <div style={{ height: '1px', background: 'rgba(0,0,0,0.07)' }} />
        )}
      </motion.div>
      {/* ── Products grid ──────────────────────────────────────────────────── */}
      <div className="px-3 sm:px-6 lg:px-10 xl:px-16 py-7 sm:py-10">
        {productsLoading ? (
          // Skeleton grid while products load
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-3 gap-y-8 sm:gap-x-6 xl:gap-x-9">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[5/7]"
                style={{
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-3 gap-y-8 sm:gap-x-6 xl:gap-x-9">
            {filteredProducts.map((product) => (
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
        <div className="px-3 sm:px-6 lg:px-10 xl:px-16 pb-16 pt-2 text-[0.7rem] md:text-[0.8rem]">
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
                    className="grid grid-flow-col auto-cols-[calc((100%-0.75rem)/2)] sm:auto-cols-[calc((100%-3rem)/3)] lg:auto-cols-[calc((100%-4.5rem)/4)] xl:auto-cols-[calc((100%-9rem)/5)] overflow-x-auto gap-x-3 sm:gap-x-6 xl:gap-x-9 pb-1"
                    style={{ scrollbarWidth: 'none' }}
                  >
                    {isLoading
                      ? Array.from({ length: 4 }).map((_, i) => (
                          <div
                            key={i}
                            className="w-full aspect-[5/7]"
                            style={{
                              background:
                                'linear-gradient(90deg, #ede8e2 25%, #f5f0ea 50%, #ede8e2 75%)',
                              backgroundSize: '200% 100%',
                              animation: `skeleton-shimmer 1.6s ${i * 0.1}s infinite`,
                            }}
                          />
                        ))
                      : catProducts.map((p) => (
                          <div key={p.productId} className="min-w-0">
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
