"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageTitle } from "@/hooks/usePagetitle";
import {
  deleteImage,
  fetchAllImages,
  fetchAllProduct,
  setImageAsPrimary,
} from "@/lib/api/productApi";
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconEmptyBox,
  IconStar,
} from "@/providers/Icons";

// ── Types ──────────────────────────────────────────────────────────────────────

interface ProductImage {
  imageId: string;
  imageUrl: string;
  isPrimary: boolean;
  displayOrder: number;
  product: {
    productId: string;
    name: string;
    category: { name: string };
  };
}

interface ProductOption {
  productId: string;
  name: string;
}

interface PagedResponse {
  content: ProductImage[];
  totalElements: number;
  totalPages: number;
}

const PAGE_SIZE = 24;

// ── Select helper ─────────────────────────────────────────────────────────────

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-3 pr-8 py-2 text-sm bg-white/60 border border-gray-200 rounded-xl text-gray-700 appearance-none cursor-pointer focus:outline-none focus:border-gray-400 focus:bg-white transition-colors"
      >
        {children}
      </select>
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
        <IconChevronDown />
      </span>
    </div>
  );
}

// ── Delete confirmation dialog ────────────────────────────────────────────────

interface DeleteDialogProps {
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

function DeleteDialog({ onClose, onConfirm }: DeleteDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setDeleting(true);
    setError("");
    try {
      await onConfirm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete image");
      setDeleting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm bg-white/70 backdrop-blur-md border border-white/60 rounded-2xl shadow-xl p-6 mx-4">
        <div className="flex flex-col gap-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">
              Delete image
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Are you sure you want to permanently delete this image?
            </p>
          </div>
          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
              {error}
            </p>
          )}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Image card ────────────────────────────────────────────────────────────────

interface ImageCardProps {
  img: ProductImage;
  onSetPrimary: (img: ProductImage) => void;
  onDelete: (img: ProductImage) => void;
  onNavigate: (productId: string) => void;
}

function ImageCard({
  img,
  onSetPrimary,
  onDelete,
  onNavigate,
}: ImageCardProps) {
  return (
    <div className="flex flex-col gap-1 bg-white/30 rounded-xl p-2 hover:bg-white/50 transition-all">
      <div
        className={`aspect-4/3 rounded-xl overflow-hidden relative group ${
          img.isPrimary ? "border-2 border-amber-400" : "border border-white/50"
        }`}
      >
        <img
          src={img.imageUrl}
          alt={img.product?.name ?? "Product image"}
          className="w-full h-full object-cover"
        />

        {img.isPrimary && (
          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center shadow-sm">
            <span className="text-white scale-[0.65]">
              <IconStar />
            </span>
          </div>
        )}

        <div className="absolute inset-0 rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2.5">
          {!img.isPrimary && (
            <button
              onClick={() => onSetPrimary(img)}
              className="px-3 py-1.5 bg-white rounded-lg text-xs font-medium text-gray-800 hover:bg-gray-100 transition-colors shadow-sm"
            >
              Set as primary
            </button>
          )}
          <button
            onClick={() => onDelete(img)}
            className="px-3 py-1.5 bg-red-500 rounded-lg text-xs font-medium text-white hover:bg-red-600 transition-colors shadow-sm"
          >
            Delete
          </button>
        </div>
      </div>

      <div>
        <p
          className="text-[12px] font-semibold text-gray-800 leading-tight hover:underline cursor-pointer truncate"
          title={img.product?.name}
          onClick={() => onNavigate(img.product?.productId)}
        >
          {img.product?.name ?? "—"}
        </p>
        <p className="text-[11px] text-[#616a7c] mt-0.5 truncate">
          {img.product?.category?.name ?? ""}
        </p>
      </div>
    </div>
  );
}

// Custome Dropdown

// function CustomSelect({
//   value,
//   onChange,
//   options,
// }: {
//   value: string;
//   onChange: (v: string) => void;
//   options: { value: string; label: string }[];
// }) {
//   const [open, setOpen] = useState(false);
//   const selected = options.find((o) => o.value === value);

//   return (
//     <div className="relative">
//       <button
//         onClick={() => setOpen(!open)}
//         className="flex items-center justify-between gap-2 pl-3 pr-8 py-2 text-sm bg-white/60 border border-gray-200 rounded-xl text-gray-700 min-w-[160px] focus:outline-none focus:border-gray-400 transition-colors"
//       >
//         {selected?.label || "Select..."}
//         <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
//           <IconChevronDown />
//         </span>
//       </button>

//       {open && (
//         <>
//           <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
//           <div className="absolute top-full mt-1 left-0 w-full z-50 bg-white/90 backdrop-blur-md border border-gray-200 rounded-xl overflow-hidden shadow-lg max-h-60 overflow-y-auto">
//             {options.map((o) => (
//               <button
//                 key={o.value}
//                 onClick={() => {
//                   onChange(o.value);
//                   setOpen(false);
//                 }}
//                 className={`w-full text-left px-3 py-2 text-sm transition-colors ${
//                   o.value === value
//                     ? "bg-gray-100 text-gray-800 font-medium"
//                     : "text-gray-600 hover:bg-gray-50"
//                 }`}
//               >
//                 {o.label}
//               </button>
//             ))}
//           </div>
//         </>
//       )}
//     </div>
//   );
// }

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProductsImages() {
  const title = usePageTitle();
  const router = useRouter();

  const [images, setImages] = useState<ProductImage[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [productFilter, setProductFilter] = useState("");
  const [primaryOnly, setPrimaryOnly] = useState(false);
  const [page, setPage] = useState(0);

  const [products, setProducts] = useState<ProductOption[]>([]);

  const [deleteTarget, setDeleteTarget] = useState<ProductImage | null>(null);
  const [settingPrimary, setSettingPrimary] = useState<string | null>(null);

  // Load product list for filter dropdown
  useEffect(() => {
    fetchAllProduct()
      .then((data) => {
        const list: ProductOption[] = (data.content ?? []).map(
          (p: { productId: string; name: string }) => ({
            productId: p.productId,
            name: p.name,
          }),
        );
        setProducts(list);
      })
      .catch(() => {});
  }, []);

  // Load images when filters/page change
  useEffect(() => {
    fetchData();
  }, [productFilter, primaryOnly, page]);

  async function fetchData() {
    setLoading(true);
    try {
      const params: Parameters<typeof fetchAllImages>[0] = {
        page,
        size: PAGE_SIZE,
      };
      if (productFilter) params.productId = productFilter;
      if (primaryOnly) params.primaryOnly = true;

      const data: PagedResponse = await fetchAllImages(params);
      setImages(data.content ?? []);
      setTotalElements(data.totalElements ?? 0);
      setTotalPages(Math.max(1, data.totalPages ?? 1));
    } catch {
      setImages([]);
    } finally {
      setLoading(false);
    }
  }

  function changeProductFilter(v: string) {
    setProductFilter(v);
    setPage(0);
  }

  function changePrimaryOnly(v: boolean) {
    setPrimaryOnly(v);
    setPage(0);
  }

  async function handleSetPrimary(img: ProductImage) {
    setSettingPrimary(img.imageId);
    try {
      await setImageAsPrimary(img.imageId);
      await fetchData();
    } catch {
      // silently ignore — user still sees the image
    } finally {
      setSettingPrimary(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await deleteImage(deleteTarget.imageId);
    setDeleteTarget(null);
    await fetchData();
  }

  const showingFrom = totalElements === 0 ? 0 : page * PAGE_SIZE + 1;
  const showingTo = Math.min((page + 1) * PAGE_SIZE, totalElements);

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i);
  const visiblePages = pageNumbers.filter((n) => {
    if (totalPages <= 7) return true;
    if (n === 0 || n === totalPages - 1) return true;
    return Math.abs(n - page) <= 2;
  });

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
          {!loading && (
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              {totalElements} images
            </span>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl px-5 py-3 flex items-center gap-4">
        {/* Product dropdown */}
        <Select value={productFilter} onChange={changeProductFilter}>
          <option value="">All products</option>
          {products.map((p) => (
            <option key={p.productId} value={p.productId}>
              {p.name}
            </option>
          ))}
        </Select>

        {/* Primary only toggle */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={primaryOnly}
              onChange={(e) => changePrimaryOnly(e.target.checked)}
            />
            <div
              className={`w-8 h-4.5 rounded-full transition-colors ${
                primaryOnly ? "bg-amber-400" : "bg-gray-200"
              }`}
            />
            <div
              className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${
                primaryOnly ? "translate-x-3.5" : "translate-x-0"
              }`}
            />
          </div>
          <span className="text-sm text-gray-600">Primary images only</span>
        </label>

        {/* Count */}
        <p className="ml-auto text-sm text-[#616a7c]">
          Showing{" "}
          <span className="font-medium text-gray-800">{totalElements}</span>{" "}
          image{totalElements !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Image grid card */}
      <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl p-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <svg
              className="w-5 h-5 animate-spin text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            <span className="text-xs text-gray-400">Loading images...</span>
          </div>
        ) : images.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-300">
            <IconEmptyBox />
            <p className="text-lg font-medium text-gray-500">No images found</p>
            <p className="text-sm text-gray-400">
              {primaryOnly || productFilter
                ? "Try adjusting your filter"
                : "Images will appear here once you add products"}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-5 gap-3">
              {images.map((img) => (
                <div
                  key={img.imageId}
                  className={`transition-opacity ${
                    settingPrimary === img.imageId
                      ? "opacity-50 pointer-events-none"
                      : ""
                  }`}
                >
                  <ImageCard
                    img={img}
                    onSetPrimary={handleSetPrimary}
                    onDelete={setDeleteTarget}
                    onNavigate={(pid) => router.push(`/products/edit/${pid}`)}
                  />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <p className="text-xs text-[#616a7c]">
                  Showing {showingFrom}–{showingTo} of {totalElements} image
                  {totalElements !== 1 ? "s" : ""}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => p - 1)}
                    disabled={page === 0}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors ${
                      page === 0 ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <IconChevronLeft />
                    Previous
                  </button>

                  {visiblePages.map((n, i) => {
                    const prev = visiblePages[i - 1];
                    const showGap = prev !== undefined && n - prev > 1;
                    return (
                      <span key={n} className="flex items-center gap-1">
                        {showGap && (
                          <span className="px-1 text-gray-300 text-sm select-none">
                            …
                          </span>
                        )}
                        <button
                          onClick={() => setPage(n)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            n === page
                              ? "bg-black text-white"
                              : "text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          {n + 1}
                        </button>
                      </span>
                    );
                  })}

                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= totalPages - 1}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors ${
                      page >= totalPages - 1
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    Next
                    <IconChevronRight />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete confirmation */}
      {deleteTarget && (
        <DeleteDialog
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
