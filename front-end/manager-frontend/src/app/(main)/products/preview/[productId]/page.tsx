"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageTitle } from "@/hooks/usePagetitle";
import {
  fetchProductDetail,
  archiveProduct,
  unarchiveProduct,
} from "@/lib/api/productApi";
import {
  IconChevronLeft,
  IconChevronDown,
  IconEdit,
  IconLoader,
  IconStar,
} from "@/providers/Icons";

// ── Types ──────────────────────────────────────────────────────────────────────

interface ProductImage {
  imageId: string;
  viewUrl: string;
  isPrimary: boolean;
  displayOrder: number;
}

interface ProductVariant {
  variantId: string;
  sku: string;
  color: string;
  size: string;
  price: number;
  stockQuantity: number;
  status: "ACTIVE" | "OUT_OF_STOCK";
  stockLevel: "GOOD" | "LOW" | "OUT_OF_STOCK";
}

interface ProductAttribute {
  attributeKey: string;
  attributeValue: string;
}

interface CustomOptionValue {
  valueId: string;
  valueName: string;
  colorCode?: string;
  textureUrl?: string;
  priceAdjustment: number;
  isDefault: boolean;
}

interface CustomOption {
  optionId: string;
  optionName: string;
  optionType: "COLOR" | "TEXTURE" | "MODEL" | "BOOLEAN";
  meshName: string;
  values: CustomOptionValue[];
}

interface ProductDetail {
  productId: string;
  name: string;
  status: "ACTIVE" | "OUT_OF_STOCK" | "ARCHIVED";
  basePrice: number;
  description: string;
  category: { categoryId: string; name: string };
  images: ProductImage[];
  variants: ProductVariant[];
  attributes: ProductAttribute[];
  customOptions: CustomOption[];
  createdAt: string;
  updatedAt: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, { cls: string; label: string }> = {
  ACTIVE: { cls: "bg-emerald-100 text-emerald-700", label: "Active" },
  OUT_OF_STOCK: { cls: "bg-red-100 text-red-700", label: "Out of stock" },
  ARCHIVED: { cls: "bg-gray-200 text-gray-700", label: "Archived" },
};

const STOCK_LEVEL_BADGE: Record<string, string> = {
  GOOD: "bg-emerald-100 text-emerald-700",
  LOW: "bg-amber-100 text-amber-700",
  OUT_OF_STOCK: "bg-red-100 text-red-700",
};

const OPTION_TYPE_BADGE: Record<string, string> = {
  COLOR: "bg-indigo-100 text-indigo-700",
  TEXTURE: "bg-orange-100 text-orange-700",
  MODEL: "bg-teal-100 text-teal-700",
  BOOLEAN: "bg-gray-200 text-gray-700",
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatINR(n: number) {
  return "₹" + Number(n).toLocaleString("en-IN");
}

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function stockClass(qty: number) {
  if (qty === 0) return "text-red-500 font-medium";
  if (qty <= 4) return "text-amber-500 font-medium";
  return "text-gray-700";
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ProductPreview() {
  usePageTitle();
  const params = useParams();
  const router = useRouter();
  const productId = params.productId as string;

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);
  const [expandedOptions, setExpandedOptions] = useState<Set<string>>(
    new Set(),
  );
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchProductDetail(productId)
      .then((data: ProductDetail) => {
        setProduct(data);
        const primary = data.images?.find((img) => img.isPrimary);
        setActiveImageUrl(
          primary?.viewUrl ?? data.images?.[0]?.viewUrl ?? null,
        );
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [productId]);

  function toggleOption(optionId: string) {
    setExpandedOptions((prev) => {
      const next = new Set(prev);
      if (next.has(optionId)) next.delete(optionId);
      else next.add(optionId);
      return next;
    });
  }

  async function handleArchive() {
    if (!product) return;
    setArchiving(true);
    try {
      await archiveProduct(productId);
      const data: ProductDetail = await fetchProductDetail(productId);
      setProduct(data);
    } catch {
      // silently fail
    } finally {
      setArchiving(false);
    }
  }

  async function handleUnarchive() {
    if (!product) return;
    setArchiving(true);
    try {
      await unarchiveProduct(productId);
      const data: ProductDetail = await fetchProductDetail(productId);
      setProduct(data);
    } catch {
      // silently fail
    } finally {
      setArchiving(false);
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 gap-3 text-gray-400">
        <IconLoader />
        <span className="text-sm">Loading product details...</span>
      </div>
    );
  }

  // ── Error / not found ────────────────────────────────────────────────────────

  if (notFound || !product) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-xl font-medium text-gray-500">Product not found</p>
        <button
          onClick={() => router.push("/products")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-600"
        >
          <IconChevronLeft /> Back to products
        </button>
      </div>
    );
  }

  // ── Derived stats ────────────────────────────────────────────────────────────

  const images = product.images ?? [];
  const variants = product.variants ?? [];
  const attributes = product.attributes ?? [];
  const customOptions = product.customOptions ?? [];

  const totalStock = variants.reduce(
    (sum, v) => sum + (v.stockQuantity ?? 0),
    0,
  );
  const prices = variants.map((v) => v.price).filter((p) => p != null && p > 0);
  const minPrice = prices.length ? Math.min(...prices) : product.basePrice;
  const maxPrice = prices.length ? Math.max(...prices) : product.basePrice;
  const priceRange =
    minPrice === maxPrice
      ? formatINR(minPrice)
      : `${formatINR(minPrice)} — ${formatINR(maxPrice)}`;

  const statusBadge = STATUS_BADGE[product.status] ?? STATUS_BADGE.ACTIVE;

  // ── Quick stat card ──────────────────────────────────────────────────────────

  const statCards = [
    {
      label: "Total variants",
      value: String(variants.length),
      highlight: false,
    },
    {
      label: "Total stock",
      value: String(totalStock),
      highlight: totalStock === 0,
    },
    { label: "Total images", value: String(images.length), highlight: false },
    {
      label: "Total attributes",
      value: String(attributes.length),
      highlight: false,
    },
    { label: "Price range", value: priceRange, highlight: false, wide: true },
    {
      label: "Custom options",
      value: customOptions.length > 0 ? String(customOptions.length) : "None",
      highlight: false,
      note: customOptions.length === 0 ? "Not customizable" : undefined,
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/products")}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-white/50 transition-colors"
          >
            <IconChevronLeft />
          </button>
          <h1 className="text-xl font-bold text-gray-800">{product.name}</h1>
          <span
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${statusBadge.cls}`}
          >
            {statusBadge.label}
          </span>
        </div>
        <button
          onClick={() => router.push(`/products/edit/${productId}`)}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
        >
          <IconEdit /> Edit product
        </button>
      </div>

      {/* ── Quick stats row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-6 gap-3">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-xl px-4 py-3 flex flex-col gap-1"
          >
            <p className="text-[10px] font-medium text-[#616a7c] uppercase tracking-wide">
              {card.label}
            </p>
            <p
              className={`text-lg font-bold leading-tight ${card.highlight ? "text-red-500" : "text-gray-800"}`}
            >
              {card.note ?? card.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Two-column layout ───────────────────────────────────────────────── */}
      <div className="flex gap-6 items-start">
        {/* ── LEFT column ─────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col gap-5 min-w-0">
          {/* ─ Section A: Image gallery ──────────────────────────────────── */}
          <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl p-5 flex flex-col gap-4">
            <p className="text-sm font-semibold text-gray-700">
              Images{" "}
              <span className="text-gray-400 font-normal">
                ({images.length})
              </span>
            </p>

            {/* Large image */}
            {activeImageUrl ? (
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
                <img
                  src={activeImageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-[4/3] rounded-xl bg-gray-100 flex flex-col items-center justify-center gap-2">
                <svg
                  className="w-10 h-10 text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.25}
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 15l-5-5L5 21"
                  />
                </svg>
                <p className="text-sm text-gray-400">No images</p>
              </div>
            )}

            {/* Thumbnail strip */}
            {images.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images
                  .slice()
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map((img) => {
                    const isActive = activeImageUrl === img.viewUrl;
                    const isPrimary = img.isPrimary;
                    return (
                      <button
                        key={img.imageId}
                        onClick={() => setActiveImageUrl(img.viewUrl)}
                        className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all border-2 ${
                          isActive
                            ? "ring-2 ring-gray-800 border-transparent"
                            : isPrimary
                              ? "ring-2 ring-amber-400 border-transparent"
                              : "border-transparent hover:border-gray-300"
                        }`}
                      >
                        <img
                          src={img.viewUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </button>
                    );
                  })}
              </div>
            )}
          </div>

          {/* ─ Section B: Variants table ─────────────────────────────────── */}
          <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-700">
                Variants{" "}
                <span className="text-gray-400 font-normal">
                  ({variants.length})
                </span>
              </p>
            </div>

            {variants.length === 0 ? (
              <div className="flex items-center justify-center py-10">
                <p className="text-sm text-gray-400">No variants added</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-gray-400 font-medium border-b border-gray-100">
                    <th className="text-left px-5 py-3">Color</th>
                    <th className="text-left px-5 py-3">Size</th>
                    <th className="text-left px-5 py-3">Price</th>
                    <th className="text-left px-5 py-3">Stock</th>
                    <th className="text-left px-5 py-3">SKU</th>
                    <th className="text-left px-5 py-3">Status</th>
                    <th className="text-left px-5 py-3">Level</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v) => (
                    <tr
                      key={v.variantId}
                      className="border-t border-gray-100 hover:bg-white/30 transition-colors"
                    >
                      <td className="px-5 py-3 text-gray-700">
                        {v.color || "—"}
                      </td>
                      <td className="px-5 py-3 text-gray-600">
                        {v.size || "—"}
                      </td>
                      <td className="px-5 py-3 font-medium text-gray-800 tabular-nums">
                        {formatINR(v.price)}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`tabular-nums ${stockClass(v.stockQuantity)}`}
                        >
                          {v.stockQuantity}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-[11px] font-mono text-gray-400">
                          {v.sku}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            v.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {v.status === "ACTIVE" ? "Active" : "Out of stock"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STOCK_LEVEL_BADGE[v.stockLevel] ?? "bg-gray-100 text-gray-600"}`}
                        >
                          {v.stockLevel?.replace(/_/g, " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* ─ Section C: Custom options ─────────────────────────────────── */}
          <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-700">
                Customization options{" "}
                <span className="text-gray-400 font-normal">
                  ({customOptions.length})
                </span>
              </p>
            </div>

            {customOptions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <p className="text-gray-500 font-medium">Not customizable</p>
                <p className="text-sm text-gray-400 text-center">
                  Add customization options from the edit page
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {customOptions.map((opt) => {
                  const isExpanded = expandedOptions.has(opt.optionId);
                  return (
                    <div key={opt.optionId}>
                      {/* Option header */}
                      <button
                        onClick={() => toggleOption(opt.optionId)}
                        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/30 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-semibold text-gray-800">
                            {opt.optionName}
                          </p>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${OPTION_TYPE_BADGE[opt.optionType] ?? "bg-gray-100 text-gray-600"}`}
                          >
                            {opt.optionType}
                          </span>
                          <span className="text-[11px] font-mono text-gray-400">
                            {opt.meshName}
                          </span>
                        </div>
                        <span
                          className={`text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        >
                          <IconChevronDown />
                        </span>
                      </button>

                      {/* Option body — expanded */}
                      {isExpanded && (
                        <div className="px-5 pb-5">
                          {opt.values?.length === 0 ? (
                            <p className="text-sm text-gray-400">
                              No values added
                            </p>
                          ) : (
                            <div className="flex flex-wrap gap-3">
                              {opt.values.map((val) => (
                                <div
                                  key={val.valueId}
                                  className="flex flex-col items-center gap-1.5 relative"
                                >
                                  {/* Value visual */}
                                  {opt.optionType === "COLOR" && (
                                    <div
                                      className="w-8 h-8 rounded-full border border-gray-200 shadow-sm"
                                      style={{
                                        backgroundColor:
                                          val.colorCode ?? "#ccc",
                                      }}
                                      title={val.colorCode}
                                    />
                                  )}
                                  {opt.optionType === "TEXTURE" &&
                                    (val.textureUrl ? (
                                      <img
                                        src={val.textureUrl}
                                        alt={val.valueName}
                                        className="w-8 h-8 rounded-lg object-cover border border-gray-200"
                                      />
                                    ) : (
                                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                        <svg
                                          className="w-4 h-4 text-gray-400"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                          strokeWidth={1.5}
                                        >
                                          <rect
                                            x="3"
                                            y="3"
                                            width="18"
                                            height="18"
                                            rx="2"
                                          />
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M21 15l-5-5L5 21"
                                          />
                                        </svg>
                                      </div>
                                    ))}
                                  {opt.optionType === "MODEL" && (
                                    <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                                      <svg
                                        className="w-5 h-5 text-teal-500"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={1.5}
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                        />
                                      </svg>
                                    </div>
                                  )}
                                  {opt.optionType === "BOOLEAN" && (
                                    <div
                                      className={`w-8 h-8 rounded-full flex items-center justify-center ${val.valueName?.toLowerCase() === "yes" || val.valueName?.toLowerCase() === "true" ? "bg-emerald-100" : "bg-gray-100"}`}
                                    >
                                      <svg
                                        className={`w-4 h-4 ${val.valueName?.toLowerCase() === "yes" || val.valueName?.toLowerCase() === "true" ? "text-emerald-600" : "text-gray-400"}`}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          d="M5 13l4 4L19 7"
                                        />
                                      </svg>
                                    </div>
                                  )}

                                  {/* Default star */}
                                  {val.isDefault && (
                                    <span className="absolute -top-1 -right-1">
                                      <IconStar />
                                    </span>
                                  )}

                                  {/* Name */}
                                  <p className="text-[10px] text-gray-600 text-center max-w-[56px] leading-tight">
                                    {val.valueName}
                                  </p>

                                  {/* Price adjustment */}
                                  {val.priceAdjustment !== 0 && (
                                    <p
                                      className={`text-[10px] font-medium ${val.priceAdjustment > 0 ? "text-emerald-600" : "text-red-600"}`}
                                    >
                                      {val.priceAdjustment > 0 ? "+" : ""}
                                      {formatINR(val.priceAdjustment)}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT column (sticky) ────────────────────────────────────────── */}
        <div className="w-80 shrink-0 flex flex-col gap-5 sticky top-6">
          {/* ─ Section D: Product info ───────────────────────────────────── */}
          <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-medium text-[#616a7c] uppercase tracking-wide">
                Category
              </span>
              <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 self-start">
                {product.category?.name ?? "—"}
              </span>
            </div>

            <div>
              <p className="text-xl font-bold text-gray-800 leading-tight">
                {product.name}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-medium text-[#616a7c] uppercase tracking-wide">
                Base price
              </span>
              <p className="text-2xl font-bold text-gray-800 mt-1 tabular-nums">
                {formatINR(product.basePrice)}
              </p>
            </div>

            {product.description && (
              <div>
                <span className="text-[10px] font-medium text-[#616a7c] uppercase tracking-wide">
                  Description
                </span>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>
            )}

            <div className="border-t border-gray-100 pt-3 flex flex-col gap-1">
              <p className="text-[11px] text-gray-400">
                Created {formatDate(product.createdAt)}
              </p>
              {product.updatedAt && (
                <p className="text-[11px] text-gray-400">
                  Updated {formatDate(product.updatedAt)}
                </p>
              )}
            </div>
          </div>

          {/* ─ Section E: Attributes ────────────────────────────────────── */}
          <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl p-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">
              Attributes{" "}
              <span className="text-gray-400 font-normal">
                ({attributes.length})
              </span>
            </p>

            {attributes.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                No attributes
              </p>
            ) : (
              <div>
                {attributes.map((attr, i) => (
                  <div
                    key={i}
                    className="flex justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <span className="text-xs text-gray-500">
                      {attr.attributeKey}
                    </span>
                    <span className="text-xs text-gray-800 font-medium text-right max-w-[55%]">
                      {attr.attributeValue}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ─ Section F: Quick actions ──────────────────────────────────── */}
          <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl p-5 flex flex-col gap-3">
            <p className="text-sm font-semibold text-gray-700">Quick actions</p>

            <button
              onClick={() => router.push(`/products/edit/${productId}`)}
              className="w-full py-2.5 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
            >
              <IconEdit /> Edit product
            </button>

            {product.status === "ACTIVE" && (
              <button
                onClick={handleArchive}
                disabled={archiving}
                className="w-full py-2.5 border border-red-300 text-red-600 text-sm font-medium rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {archiving && <IconLoader />}
                {archiving ? "Archiving..." : "Archive product"}
              </button>
            )}

            {product.status === "ARCHIVED" && (
              <button
                onClick={handleUnarchive}
                disabled={archiving}
                className="w-full py-2.5 border border-emerald-300 text-emerald-600 text-sm font-medium rounded-xl hover:bg-emerald-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {archiving && <IconLoader />}
                {archiving ? "Restoring..." : "Restore product"}
              </button>
            )}

            <div className="w-full h-px bg-gray-200" />

            <div className="relative group">
              <button
                disabled
                className="w-full py-2.5 border border-gray-200 text-gray-400 text-sm font-medium rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.75}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                View in store
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-gray-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
                Coming soon
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
