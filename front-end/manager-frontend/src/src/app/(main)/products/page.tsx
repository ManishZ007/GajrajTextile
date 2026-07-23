"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePageTitle } from "@/hooks/usePagetitle";
import {
  IconArchive,
  IconChevronLeft,
  IconChevronRight,
  IconEdit,
  IconEmptyBox,
  IconEye,
  IconPlus,
  IconProduct,
  IconSearch,
} from "@/providers/Icons";
import { archiveProduct, fetchAllProduct } from "@/lib/api/productApi";
import { Product } from "@/declarations";

type Status = "ACTIVE" | "OUT_OF_STOCK";
type Filter = "ALL" | Status;

const PAGE_SIZE = 5;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatINR(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: Status }) {
  return status === "ACTIVE" ? (
    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
      Active
    </span>
  ) : (
    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
      Out of stock
    </span>
  );
}

interface StatCardProps {
  label: string;
  count: number;
  indicator?: "green" | "red" | "icon";
  active: boolean;
  onClick: () => void;
}

function StatCard({ label, count, indicator, active, onClick }: StatCardProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/40 backdrop-blur-sm border transition-all text-left ${
        active
          ? "border-gray-400/60 bg-white/60"
          : "border-white/50 hover:bg-white/50"
      }`}
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gray-100">
        {indicator === "green" && (
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
        )}
        {indicator === "red" && (
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
        )}
        {indicator === "icon" && (
          <span className="text-gray-500">
            <IconProduct />
          </span>
        )}
      </div>
      <div>
        <p className="text-xl font-bold text-gray-800 leading-none">{count}</p>
        <p className="text-xs text-[#616a7c] mt-0.5">{label}</p>
      </div>
    </button>
  );
}

export default function ProductsAll() {
  const title = usePageTitle();
  const router = useRouter();

  const [filter, setFilter] = useState<Filter>("ALL");
  const [category, setCategory] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [product, setProduct] = useState<Product[]>([]);
  const [loading, setLoding] = useState(true);

  useEffect(() => {
    fetchAllProduct()
      .then((data) => setProduct(data.content))
      .catch(() => setProduct([]))
      .finally(() => setLoding(false));
  }, []);

  // Stat counts (always from full data)
  const total = product.length;
  const activeCount = product.filter((p) => p.status === "ACTIVE").length;
  const oosCount = product.filter((p) => p.status === "OUT_OF_STOCK").length;

  // Unique categories derived from loaded products
  const categories = useMemo(() => {
    const names = product.map((p) => p.category?.name).filter(Boolean);
    return Array.from(new Set(names)) as string[];
  }, [product]);

  // Combined filter + search + category
  const filtered = useMemo(() => {
    let list = product;
    if (filter !== "ALL") list = list.filter((p) => p.status === filter);
    if (category !== "ALL") list = list.filter((p) => p.category?.name === category);
    if (search.trim())
      list = list.filter((p) =>
        p.name.toLowerCase().includes(search.trim().toLowerCase()),
      );
    return list;
  }, [filter, category, search]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const paginated = filtered.slice(pageStart, pageStart + PAGE_SIZE);
  const showingFrom = filtered.length === 0 ? 0 : pageStart + 1;
  const showingTo = Math.min(pageStart + PAGE_SIZE, filtered.length);

  function changeFilter(f: Filter) {
    setFilter(f);
    setPage(1);
  }
  function changeCategory(c: string) {
    setCategory(c);
    setPage(1);
  }
  function changeSearch(v: string) {
    setSearch(v);
    setPage(1);
  }

  // Page number list
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex flex-col gap-5">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
        <button
          onClick={() => router.push("/products/add")}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
        >
          <IconPlus />
          Add product
        </button>
      </div>

      {/* ── Stat pills ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <StatCard
          label="All products"
          count={total}
          indicator="icon"
          active={filter === "ALL"}
          onClick={() => changeFilter("ALL")}
        />
        <StatCard
          label="Active"
          count={activeCount}
          indicator="green"
          active={filter === "ACTIVE"}
          onClick={() => changeFilter("ACTIVE")}
        />
        <StatCard
          label="Out of stock"
          count={oosCount}
          indicator="red"
          active={filter === "OUT_OF_STOCK"}
          onClick={() => changeFilter("OUT_OF_STOCK")}
        />
      </div>

      {/* ── Search + Category filter ────────────────────────────────────────── */}
      <div className="flex gap-3">
        <div className="flex-1 bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl px-4 py-3 flex items-center gap-3">
          <span className="text-gray-400 shrink-0">
            <IconSearch />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => changeSearch(e.target.value)}
            placeholder="Search products by name..."
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
          />
          {search && (
            <button
              onClick={() => changeSearch("")}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors shrink-0"
            >
              Clear
            </button>
          )}
        </div>
        <select
          value={category}
          onChange={(e) => changeCategory(e.target.value)}
          className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl px-4 py-3 text-sm text-gray-700 outline-none cursor-pointer hover:bg-white/60 transition-colors"
        >
          <option value="ALL">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* ── Table card ─────────────────────────────────────────────────────── */}
      <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          /* ── Empty state ─────────────────────────────────────────────────── */
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-300">
            <IconEmptyBox />
            {filter === "ALL" && category === "ALL" && search === "" ? (
              <>
                <p className="text-lg font-medium text-gray-500">
                  No products yet
                </p>
                <p className="text-sm text-gray-400">
                  Start by adding your first product
                </p>
                <button
                  onClick={() => router.push("/products/add")}
                  className="mt-2 flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
                >
                  <IconPlus />
                  Add your first product
                </button>
              </>
            ) : (
              <>
                <p className="text-lg font-medium text-gray-500">
                  No products found
                </p>
                <p className="text-sm text-gray-400">
                  Try adjusting your search or filter
                </p>
              </>
            )}
          </div>
        ) : (
          <>
            {/* ── Table ────────────────────────────────────────────────────── */}
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
                {paginated.map((product) => (
                  <tr
                    key={product.productId}
                    className="border-t border-gray-100 hover:bg-white/30 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3">
                      {product.primaryImage ? (
                        <img
                          src={`${product.primaryImage}`}
                          alt={product.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 shrink-0" />
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-800">
                        {product.name}
                      </p>
                      <p className="text-xs text-[#616a7c] mt-0.5">
                        {product.category.name}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                        {product.category.name}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-700 font-medium">
                      {formatINR(product.basePrice)}
                    </td>
                    <td className="px-5 py-3 text-[#616a7c]">
                      {product.variantCount} variant
                      {product.variantCount !== 1 ? "s" : ""}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={
                          product.totalStock === 0
                            ? "text-red-500 font-medium"
                            : "text-gray-700"
                        }
                      >
                        {product.totalStock}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill status={product.status} />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          title="View"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/products/preview/${product.productId}`);
                          }}
                        >
                          <IconEye />
                        </button>
                        <button
                          title="Edit"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/products/edit/${product.productId}`);
                          }}
                        >
                          <IconEdit />
                        </button>
                        <button
                          title="Archive"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          onClick={async (e) => {
                            e.stopPropagation();
                            await archiveProduct(product.productId);
                            const data = await fetchAllProduct();
                            setProduct(data.content);
                          }}
                        >
                          <IconArchive />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ── Pagination ───────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
              <p className="text-xs text-[#616a7c]">
                Showing {showingFrom}–{showingTo} of {filtered.length} product
                {filtered.length !== 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-1">
                {/* Previous */}
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={safePage === 1}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors ${
                    safePage === 1 ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <IconChevronLeft />
                  Previous
                </button>

                {/* Page numbers */}
                {pageNumbers.map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      n === safePage
                        ? "bg-black text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {n}
                  </button>
                ))}

                {/* Next */}
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={safePage === totalPages}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors ${
                    safePage === totalPages
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  Next
                  <IconChevronRight />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
