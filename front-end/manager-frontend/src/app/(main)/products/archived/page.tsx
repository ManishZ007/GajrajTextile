"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageTitle } from "@/hooks/usePagetitle";
import { fetchArchivedProducts, unarchiveProduct } from "@/lib/api/productApi";
import {
  IconArchived,
  IconChevronLeft,
  IconChevronRight,
  IconEmptyBox,
  IconTrash,
} from "@/providers/Icons";

// ── Types ──────────────────────────────────────────────────────────────────────

interface ArchivedProduct {
  productId: string;
  name: string;
  primaryImage: string | null;
  basePrice: number;
  variantCount: number;
  totalStock: number;
  category: { name: string };
  status: string;
}

interface PagedResponse {
  content: ArchivedProduct[];
  totalElements: number;
  totalPages: number;
}

const PAGE_SIZE = 10;

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatINR(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

// ── Restore icon (undo arrow) ─────────────────────────────────────────────────

function IconRestore() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProductsArchived() {
  const title = usePageTitle();
  const router = useRouter();

  const [products, setProducts] = useState<ArchivedProduct[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    load();
  }, [page]);

  async function load() {
    setLoading(true);
    try {
      const data: PagedResponse = await fetchArchivedProducts({
        page,
        size: PAGE_SIZE,
      });
      setProducts(data.content ?? []);
      setTotalElements(data.totalElements ?? 0);
      setTotalPages(Math.max(1, data.totalPages ?? 1));
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore(productId: string) {
    setRestoringId(productId);
    try {
      await unarchiveProduct(productId);
      showToast("Product restored successfully");
      await load();
    } catch {
      showToast("Failed to restore product");
    } finally {
      setRestoringId(null);
    }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
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
        <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
      </div>

      {/* Info banner */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-blue-50/60 border border-blue-100/60 backdrop-blur-sm">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4 text-blue-400 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.75"
        >
          <circle cx="12" cy="12" r="10" />
          <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
        </svg>
        <p className="text-sm text-blue-600">
          Archived products are hidden from the customer site. You can restore
          them anytime.
        </p>
      </div>

      {/* Table card */}
      <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
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
          </div>
        ) : products.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-300">
            <IconEmptyBox />
            <p className="text-lg font-medium text-gray-500">
              No archived products
            </p>
            <p className="text-sm text-gray-400">
              Products you archive will appear here
            </p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-gray-400 font-medium border-b border-gray-100">
                  <th className="text-left px-5 py-3">Image</th>
                  <th className="text-left px-5 py-3">Product name</th>
                  <th className="text-left px-5 py-3">Category</th>
                  <th className="text-left px-5 py-3">Base price</th>
                  <th className="text-left px-5 py-3">Variants</th>
                  <th className="text-left px-5 py-3">Stock</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.productId}
                    className="border-t border-gray-100 hover:bg-white/30 transition-colors"
                  >
                    {/* Thumbnail */}
                    <td className="px-5 py-3">
                      {product.primaryImage ? (
                        <img
                          src={product.primaryImage}
                          alt={product.name}
                          className="w-10 h-10 rounded-lg object-cover opacity-60"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 shrink-0" />
                      )}
                    </td>

                    {/* Name + category */}
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-600">{product.name}</p>
                      <p className="text-xs text-[#616a7c] mt-0.5">
                        {product.category?.name}
                      </p>
                    </td>

                    {/* Category badge */}
                    <td className="px-5 py-3">
                      <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
                        {product.category?.name}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="px-5 py-3 text-gray-500 font-medium">
                      {formatINR(product.basePrice)}
                    </td>

                    {/* Variants */}
                    <td className="px-5 py-3 text-[#616a7c]">
                      {product.variantCount} variant
                      {product.variantCount !== 1 ? "s" : ""}
                    </td>

                    {/* Stock */}
                    <td className="px-5 py-3 text-gray-500">
                      {product.totalStock}
                    </td>

                    {/* Archived status pill */}
                    <td className="px-5 py-3">
                      <span className="bg-gray-200 text-gray-600 text-[10px] font-medium px-2 py-0.5 rounded-full">
                        Archived
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        {/* Restore */}
                        <button
                          title="Restore product"
                          disabled={restoringId === product.productId}
                          onClick={() => handleRestore(product.productId)}
                          className="flex items-center gap-1.5 border border-emerald-300 text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {restoringId === product.productId ? (
                            <svg
                              className="w-3.5 h-3.5 animate-spin"
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
                          ) : (
                            <IconRestore />
                          )}
                          Restore
                        </button>

                        {/* Permanent delete — coming soon */}
                        <button
                          title="Coming soon"
                          disabled
                          className="p-1.5 rounded-lg text-gray-300 cursor-not-allowed"
                        >
                          <IconTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                <p className="text-xs text-[#616a7c]">
                  Showing {showingFrom}–{showingTo} of {totalElements} product
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
                      page >= totalPages - 1 ? "opacity-50 cursor-not-allowed" : ""
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

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-gray-900 text-white text-sm rounded-2xl shadow-xl animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
}
