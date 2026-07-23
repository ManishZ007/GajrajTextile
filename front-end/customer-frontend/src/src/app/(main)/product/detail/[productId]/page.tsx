'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

import { ProductDetail, ProductVariant } from '@/types/productDetail';
import { clientFetch } from '@/lib/clientFetch';

import { ProductGallery } from '@/components/ProductDetail/ProductGallery';
import { ProductInfo } from '@/components/ProductDetail/ProductInfo';
import { ProductVariants } from '@/components/ProductDetail/ProductVariants';
import { ProductAttributes } from '@/components/ProductDetail/ProductAttributes';
import { ProductActions } from '@/components/ProductDetail/ProductActions';
import { ProductCare } from '@/components/ProductDetail/ProductCare';
import { ProductSkeleton } from '@/components/ProductDetail/ProductSkeleton';
import { useCartStore } from '@/store/cartStore';
import { useNotificationStore } from '@/store/notificationStore';
import { ProductSustanibility } from '@/components/ProductDetail/ProductSustanibility';

const DIVIDER = {
  paddingTop: '20px',
  borderTop: '1px solid rgba(0,0,0,0.055)',
} as const;

export default function ProductDetailPage() {
  const { productId } = useParams() as { productId: string };
  const router = useRouter();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null
  );
  const [addingToCart, setAddingToCart] = useState(false);

  const addItem = useCartStore((s) => s.addItem);
  const addNotification = useNotificationStore((s) => s.addNotification);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await clientFetch(`/api/products/detail/${productId}`);
        const data: ProductDetail = await res.json();
        setProduct(data);
      } catch {
        setError('Unable to load this product. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [productId]);

  if (loading) return <ProductSkeleton />;

  if (error || !product) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-5 px-6"
        style={{ background: '#ffffff' }}
      >
        <span
          style={{
            fontSize: '10px',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            color: '#B88A44',
          }}
        >
          Not Found
        </span>
        <h1
          className="font-serif text-center"
          style={{ fontSize: '2rem', color: '#1B1B1B', fontWeight: 400 }}
        >
          Product unavailable
        </h1>
        <p
          style={{
            color: '#888',
            fontSize: '14px',
            textAlign: 'center',
            maxWidth: '340px',
          }}
        >
          {error ?? 'This product could not be loaded.'}
        </p>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => router.back()}
          className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium cursor-pointer"
          style={{ background: '#1B1B1B', color: '#fff', marginTop: '8px' }}
        >
          <ArrowLeft size={14} strokeWidth={2} />
          Go back
        </motion.button>
      </div>
    );
  }

  const handleAddToCart = async (quantity: number) => {
    if (addingToCart) return;

    // Men's wear: multiple variants — require user to pick one
    if (product.variants.length > 1 && !selectedVariant) {
      addNotification('error', 'Please select a size before adding to cart.');
      return;
    }

    setAddingToCart(true);
    const { success } = await addItem({
      productId: product.productId,
      ...(selectedVariant ? { variantId: selectedVariant.variantId } : {}),
      quantity,
      itemType: 'READY_MADE',
    });
    setAddingToCart(false);
    if (success) {
      addNotification('success', `${product.name} added to cart`);
    } else {
      addNotification('error', 'Could not add to cart. Please try again.');
    }
  };

  const handleCustomize = () => {
    router.push(`/product/${product.productId}/customize`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      style={{ background: '#ffffff', minHeight: '100vh' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-5 sm:py-8 lg:py-12">
        {/* Back button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => router.back()}
          className="flex items-center gap-1.5 mb-5 sm:mb-8 cursor-pointer"
          style={{ color: '#5a5a5a', fontSize: '13px' }}
          whileHover={{ color: '#1B1B1B' }}
        >
          <ArrowLeft size={14} strokeWidth={2} />
          Back
        </motion.button>

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 lg:gap-14 items-start">
          {/* LEFT — Gallery (45%) */}
          <div className="w-full md:w-[78%] md:mx-auto lg:w-[45%] lg:mx-0 lg:sticky lg:top-24">
            <ProductGallery images={product.images} />
          </div>

          {/* RIGHT — Details (55%) */}
          <div className="w-full lg:w-[40%] flex flex-col gap-5 sm:gap-6">
            {/* Name / price / description */}
            <ProductInfo product={product} selectedVariant={selectedVariant} />

            {/* Care instructions */}
            <div style={DIVIDER}>
              <ProductCare />
            </div>

            {/* Sustanibility instructions */}
            <div style={DIVIDER}>
              <ProductSustanibility />
            </div>

            {/* Single variant (sarees): renders nothing but fires onVariantChange to auto-select.
                Multiple variants (men's wear): shows the size picker UI with divider. */}
            {product.variants.length === 1 && (
              <ProductVariants
                variants={product.variants}
                onVariantChange={setSelectedVariant}
              />
            )}
            {product.variants.length > 1 && (
              <div style={DIVIDER}>
                <ProductVariants
                  variants={product.variants}
                  onVariantChange={setSelectedVariant}
                />
              </div>
            )}

            {/* Attributes */}
            {product.attributes.length > 0 && (
              <div style={DIVIDER}>
                <ProductAttributes attributes={product.attributes} />
              </div>
            )}

            {/* Actions */}
            <div style={DIVIDER}>
              <ProductActions
                isCustomizable={product.isCustomizable}
                selectedVariant={selectedVariant}
                totalStock={product.totalStock}
                onAddToCart={handleAddToCart}
                onCustomize={handleCustomize}
                loading={addingToCart}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
