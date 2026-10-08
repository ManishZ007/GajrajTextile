'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  Plus,
  Minus,
  Sparkles,
  ArrowRight,
  Mail,
  MessageCircle,
} from 'lucide-react';

import { ProductVariant } from '@/types/productDetail';

interface ProductActionsProps {
  isCustomizable: boolean;
  selectedVariant: ProductVariant | null;
  totalStock: number;
  onAddToCart: (quantity: number) => void | Promise<void>;
  onCustomize: () => void;
  loading?: boolean;
}

export function ProductActions({
  isCustomizable,
  selectedVariant,
  totalStock,
  onAddToCart,
  onCustomize,
  loading = false,
}: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1);

  const stock = selectedVariant?.stockQuantity ?? totalStock;
  const isOutOfStock = stock === 0;

  const dec = () => setQuantity((q) => Math.max(1, q - 1));
  const inc = () => setQuantity((q) => Math.min(Math.max(stock, 1), q + 1));

  return (
    <div className="space-y-5">
      {/* Quantity */}
      <div className="flex items-center gap-3">
        <span
          style={{
            fontSize: '11px',
            fontWeight: 400,
            color: '#999',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
          }}
        >
          Qty
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={dec}
            disabled={quantity <= 1}
            className="w-8 h-8 flex items-center justify-center cursor-pointer transition-colors"
            style={{
              color: quantity <= 1 ? '#CCC' : '#1B1B1B',
              border: '1px solid rgba(0,0,0,0.12)',
              background: 'none',
            }}
            aria-label="Decrease quantity"
          >
            <Minus size={11} strokeWidth={2} />
          </button>
          <span
            style={{
              minWidth: '32px',
              textAlign: 'center',
              fontSize: '13px',
              fontWeight: 500,
              color: '#1B1B1B',
            }}
          >
            {quantity}
          </span>
          <button
            onClick={inc}
            disabled={isOutOfStock || quantity >= stock}
            className="w-8 h-8 flex items-center justify-center cursor-pointer transition-colors"
            style={{
              color: isOutOfStock || quantity >= stock ? '#CCC' : '#1B1B1B',
              border: '1px solid rgba(0,0,0,0.12)',
              background: 'none',
            }}
            aria-label="Increase quantity"
          >
            <Plus size={11} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Add to Cart — full width flat */}
      <motion.button
        whileTap={!isOutOfStock && !loading ? { scale: 0.985 } : {}}
        onClick={() => !isOutOfStock && !loading && onAddToCart(quantity)}
        disabled={isOutOfStock || loading}
        className="w-full flex items-center justify-center gap-2.5"
        style={{
          height: '54px',
          background: isOutOfStock ? '#E8E5E1' : '#000000',
          color: isOutOfStock ? '#AAA' : '#FFFFFF',
          fontSize: '13px',
          fontWeight: 400,
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          cursor: isOutOfStock || loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.75 : 1,
          transition: 'opacity 0.15s',
          border: 'none',
          borderRadius: '9999px',
        }}
      >
        {loading ? (
          <>
            <span
              className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"
              style={{ flexShrink: 0 }}
            />
            Adding…
          </>
        ) : isOutOfStock ? (
          'Out of Stock'
        ) : (
          <>
            <ShoppingBag size={15} strokeWidth={1.6} />
            Add to Cart
          </>
        )}
      </motion.button>

      {/* Customize — full width outline below */}
      {isCustomizable && (
        <motion.button
          whileTap={{ scale: 0.985 }}
          onClick={onCustomize}
          className="w-full flex items-center justify-center gap-2"
          style={{
            height: '54px',
            background: 'transparent',
            border: '1.5px solid #000000',
            borderRadius: '9999px',
            fontSize: '13px',
            fontWeight: 400,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color: '#1B1B1B',
            cursor: 'pointer',
          }}
        >
          Customise
        </motion.button>
      )}

      {/* Out of stock — scenario A: customizable → custom order prompt */}
      {isOutOfStock && isCustomizable && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            background: 'linear-gradient(135deg, #fdf6ec 0%, #fef9f0 100%)',
            border: '1.5px solid #e8d5b0',
            borderRadius: '20px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#1B1B1B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Sparkles size={16} strokeWidth={1.6} color="#f0c97a" />
            </div>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#1B1B1B', lineHeight: 1.3 }}>
                This design is currently out of stock
              </p>
              <p style={{ fontSize: '12px', color: '#7a6a52', marginTop: '3px', lineHeight: 1.5 }}>
                Love this Paithani? We can weave one just for you.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px', paddingLeft: '4px' }}>
            {[
              "We load this saree's colours, motifs & weave as your starting point",
              'You tweak what you like — zari, border, pallu, base colour',
              'Our weavers craft it fresh, exclusively for you',
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#1B1B1B', color: '#fff', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                  {i + 1}
                </span>
                <p style={{ fontSize: '12px', color: '#5a4a35', lineHeight: 1.5 }}>{step}</p>
              </div>
            ))}
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onCustomize}
            style={{ width: '100%', height: '52px', borderRadius: '9999px', background: '#000000', color: '#fff', fontSize: '13px', fontWeight: 400, letterSpacing: '1.5px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', border: 'none' }}
          >
            Customise &amp; Order Yours
            <ArrowRight size={15} strokeWidth={2} />
          </motion.button>

          <p style={{ fontSize: '10.5px', color: '#a08c6e', textAlign: 'center' as const, lineHeight: 1.4 }}>
            Custom orders are handcrafted to order · Delivery in 45–60 days
          </p>
        </motion.div>
      )}

      {/* Out of stock — scenario B: not customizable → contact us */}
      {isOutOfStock && !isCustomizable && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            background: 'linear-gradient(135deg, #fdf6ec 0%, #fef9f0 100%)',
            border: '1.5px solid #e8d5b0',
            borderRadius: '20px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#1B1B1B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <MessageCircle size={16} strokeWidth={1.6} color="#f0c97a" />
            </div>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#1B1B1B', lineHeight: 1.3 }}>
                This design is currently out of stock
              </p>
              <p style={{ fontSize: '12px', color: '#7a6a52', marginTop: '3px', lineHeight: 1.5 }}>
                Still interested? Reach out to us — our team will personally check if we can arrange this for you.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px', paddingLeft: '4px' }}>
            {[
              'Drop us an email with the product name and your requirements',
              'Our team reviews and gets back to you within 24 hours',
              'If possible, we arrange it specially for you',
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#1B1B1B', color: '#fff', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                  {i + 1}
                </span>
                <p style={{ fontSize: '12px', color: '#5a4a35', lineHeight: 1.5 }}>{step}</p>
              </div>
            ))}
          </div>

          {/* Email CTA */}
          <a
            href="mailto:support@gajrajpaithani.com?subject=Out of Stock Enquiry&body=Hi Gajraj Paithani Team,%0A%0AI am interested in a product that is currently out of stock. Could you please help me?%0A%0AProduct: [product name]%0A%0AThank you."
            style={{ textDecoration: 'none' }}
          >
            <motion.div
              whileTap={{ scale: 0.97 }}
              style={{ width: '100%', height: '52px', borderRadius: '9999px', background: '#000000', color: '#fff', fontSize: '13px', fontWeight: 400, letterSpacing: '1.5px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
            >
              <Mail size={15} strokeWidth={2} />
              Email Us Your Enquiry
            </motion.div>
          </a>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Mail size={11} strokeWidth={1.8} color="#a08c6e" />
            <p style={{ fontSize: '10.5px', color: '#a08c6e' }}>
              support@gajrajpaithani.com · We reply within 24 hrs
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
