"use client";

import { useEffect, useRef, useState } from "react";
import { usePageTitle } from "@/hooks/usePagetitle";
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
  getCategoryBaseImageUploadUrl,
  saveCategoryBaseImage,
  removeCategoryBaseImage,
  saveCategoryBaseContent,
} from "@/lib/api/productApi";
import {
  IconEdit,
  IconEmptyBox,
  IconLoader,
  IconPlus,
  IconTrash,
  IconUpload,
} from "@/providers/Icons";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Category {
  categoryId: string;
  name: string;
  description: string;
  productCount: number;
  createdAt: string;
  baseImageUrl: string | null;
  baseModelUrl?: string;
  baseTitle?: string | null;
  baseShortDescription?: string | null;
  baseDescription?: string | null;
  customizable?: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const inputCls =
  "w-full px-3 py-2 text-sm bg-white/60 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:bg-white transition-colors";
const labelCls = "block text-xs font-medium text-gray-500 mb-1.5";

// ── Category image widget (used inside the modal) ──────────────────────────────

function CategoryImageWidget({
  categoryId,
  baseImageUrl,
  onUpdated,
}: {
  categoryId: string;
  baseImageUrl: string | null;
  onUpdated: (updated: Category) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError("");
    setUploading(true);
    try {
      const { uploadUrl, key } = await getCategoryBaseImageUploadUrl(categoryId, file.name);
      if (!uploadUrl) throw new Error("No upload URL returned from server");
      const s3Res = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!s3Res.ok) throw new Error(`S3 upload failed: ${s3Res.status}`);
      const updated = await saveCategoryBaseImage(categoryId, key);
      onUpdated(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    setError("");
    setRemoving(true);
    try {
      const updated = await removeCategoryBaseImage(categoryId);
      onUpdated(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to remove image");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div>
      <label className={labelCls}>Base Image</label>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />

      <div className="flex items-start gap-3">
        {/* Preview */}
        <div className="w-20 h-20 rounded-xl overflow-hidden border border-gray-200 bg-gray-100 shrink-0 flex items-center justify-center">
          {baseImageUrl ? (
            <img
              src={baseImageUrl}
              alt="Category base"
              className="w-full h-full object-cover"
            />
          ) : (
            <svg
              className="w-8 h-8 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.25}
            >
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21" />
            </svg>
          )}
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {uploading ? <IconLoader /> : <IconUpload />}
            {uploading ? "Uploading..." : baseImageUrl ? "Replace image" : "Upload image"}
          </button>
          {baseImageUrl && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={removing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 border border-red-100 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {removing ? <IconLoader /> : <IconTrash />}
              {removing ? "Removing..." : "Remove image"}
            </button>
          )}
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      </div>
    </div>
  );
}

// ── Modal ──────────────────────────────────────────────────────────────────────

interface ModalProps {
  mode: "add" | "edit";
  initial: { name: string; description: string };
  category?: Category;
  onClose: () => void;
  onSave: (data: { name: string; description: string }) => Promise<void>;
  onCategoryUpdated: (updated: Category) => void;
}

function CategoryModal({ mode, initial, category, onClose, onSave, onCategoryUpdated }: ModalProps) {
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [baseTitle, setBaseTitle] = useState(category?.baseTitle ?? "");
  const [baseShortDescription, setBaseShortDescription] = useState(category?.baseShortDescription ?? "");
  const [baseDescription, setBaseDescription] = useState(category?.baseDescription ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  // liveCategory tracks the latest server state (image uploads update this without closing modal)
  const [liveCategory, setLiveCategory] = useState<Category | undefined>(category);
  // liveImageUrl is local state so the preview re-renders immediately after upload
  const [liveImageUrl, setLiveImageUrl] = useState<string | null>(category?.baseImageUrl ?? null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Category name is required"); return; }
    setSaving(true);
    setError("");
    try {
      // In edit mode: run both API calls, then close once both succeed
      if (mode === "edit" && liveCategory) {
        await onSave({ name: name.trim(), description: description.trim() });
        const updated = await saveCategoryBaseContent(liveCategory.categoryId, {
          baseTitle: baseTitle.trim() || undefined,
          baseShortDescription: baseShortDescription.trim() || undefined,
          baseDescription: baseDescription.trim() || undefined,
        });
        onCategoryUpdated(updated);
      } else {
        await onSave({ name: name.trim(), description: description.trim() });
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  function handleImageUpdated(updated: Category) {
    setLiveCategory(updated);
    setLiveImageUrl(updated.baseImageUrl ?? null);
    onCategoryUpdated(updated);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-white/70 backdrop-blur-md border border-white/60 rounded-2xl shadow-xl p-6 mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-base font-semibold text-gray-800 mb-5">
          {mode === "add" ? "Add category" : "Edit category"}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* ── Core fields ── */}
          <div>
            <label className={labelCls}>
              Category name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              autoFocus
              placeholder="e.g. Sarees"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>
              Description <span className="text-gray-300">(optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Short internal description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* ── Base image — edit only ── */}
          {mode === "edit" && liveCategory && (
            <CategoryImageWidget
              categoryId={liveCategory.categoryId}
              baseImageUrl={liveImageUrl}
              onUpdated={handleImageUpdated}
            />
          )}
          {mode === "add" && (
            <p className="text-xs text-gray-400">
              You can upload a base image after creating the category.
            </p>
          )}

          {/* ── Customer-facing content — edit only ── */}
          {mode === "edit" && (
            <>
              <div className="h-px bg-gray-100" />
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                Category Page Content
              </p>

              <div>
                <label className={labelCls}>Category Page Title</label>
                <input
                  type="text"
                  maxLength={200}
                  placeholder="Hero heading shown on the customer category page"
                  value={baseTitle}
                  onChange={(e) => setBaseTitle(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>
                  Short Description
                  <span className="ml-1.5 text-gray-300 font-normal">
                    ({baseShortDescription.length}/500)
                  </span>
                </label>
                <textarea
                  rows={2}
                  maxLength={500}
                  placeholder="Brief subtitle or teaser shown below the heading"
                  value={baseShortDescription}
                  onChange={(e) => setBaseShortDescription(e.target.value)}
                  className={`${inputCls} resize-none`}
                />
              </div>

              <div>
                <label className={labelCls}>Full Description</label>
                <textarea
                  rows={5}
                  placeholder="Full body text / about section for this category"
                  value={baseDescription}
                  onChange={(e) => setBaseDescription(e.target.value)}
                  className={`${inputCls} resize-none`}
                />
              </div>
            </>
          )}

          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium bg-black text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : mode === "add" ? "Add category" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete confirmation ────────────────────────────────────────────────────────

interface DeleteDialogProps {
  categoryName: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

function DeleteDialog({ categoryName, onClose, onConfirm }: DeleteDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setDeleting(true);
    setError("");
    try {
      await onConfirm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete category");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm bg-white/70 backdrop-blur-md border border-white/60 rounded-2xl shadow-xl p-6 mx-4">
        <div className="flex flex-col gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
            <IconTrash />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Delete category</h2>
            <p className="text-sm text-gray-500 mt-1">
              Are you sure you want to delete{" "}
              <span className="font-medium text-gray-700">{categoryName}</span>? This
              action cannot be undone.
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

// ── Page ──────────────────────────────────────────────────────────────────────

type ModalState =
  | { open: false }
  | { open: true; mode: "add" }
  | { open: true; mode: "edit"; category: Category };

type DeleteState =
  | { open: false }
  | { open: true; category: Category };

export default function ProductsCategories() {
  const title = usePageTitle();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>({ open: false });
  const [deleteDialog, setDeleteDialog] = useState<DeleteState>({ open: false });

  async function load() {
    try {
      const data = await fetchCategories();
      setCategories(Array.isArray(data) ? data : data.content ?? []);
    } catch {
      setCategories([]);
    }
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  async function handleSave(data: { name: string; description: string }) {
    if (modal.open && modal.mode === "edit") {
      await updateCategory(modal.category.categoryId, data);
    } else {
      await createCategory(data);
      setModal({ open: false });
    }
    await load();
  }

  async function handleDelete() {
    if (!deleteDialog.open) return;
    await deleteCategory(deleteDialog.category.categoryId);
    setDeleteDialog({ open: false });
    await load();
  }

  // Update a single category in state (from image upload/remove responses)
  function handleCategoryUpdated(updated: Category) {
    setCategories((prev) =>
      prev.map((c) => (c.categoryId === updated.categoryId ? updated : c)),
    );
    // Keep modal in sync if open
    if (modal.open && modal.mode === "edit" && modal.category.categoryId === updated.categoryId) {
      setModal({ open: true, mode: "edit", category: updated });
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
        <button
          onClick={() => setModal({ open: true, mode: "add" })}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
        >
          <IconPlus />
          Add category
        </button>
      </div>

      {/* Table card */}
      <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="w-5 h-5 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-300">
            <IconEmptyBox />
            <p className="text-lg font-medium text-gray-500">No categories yet</p>
            <p className="text-sm text-gray-400">Create your first product category</p>
            <button
              onClick={() => setModal({ open: true, mode: "add" })}
              className="mt-2 flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
            >
              <IconPlus />
              Add your first category
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-gray-400 font-medium border-b border-gray-100">
                <th className="text-left px-5 py-3">Category</th>
                <th className="text-left px-5 py-3">Description</th>
                <th className="text-left px-5 py-3">Products</th>
                <th className="text-left px-5 py-3">Created</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr
                  key={cat.categoryId}
                  className="border-t border-gray-100 hover:bg-white/30 transition-colors"
                >
                  {/* Name + thumbnail */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-200 bg-gray-100 shrink-0 flex items-center justify-center">
                        {cat.baseImageUrl ? (
                          <img
                            src={cat.baseImageUrl}
                            alt={cat.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <svg
                            className="w-5 h-5 text-gray-300"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.25}
                          >
                            <rect x="3" y="3" width="18" height="18" rx="3" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21" />
                          </svg>
                        )}
                      </div>
                      <span className="font-medium text-gray-800">{cat.name}</span>
                    </div>
                  </td>

                  {/* Description */}
                  <td className="px-5 py-3 max-w-xs">
                    <p className="text-[#616a7c] truncate">
                      {cat.description || (
                        <span className="text-gray-300 italic">No description</span>
                      )}
                    </p>
                  </td>

                  {/* Product count */}
                  <td className="px-5 py-3">
                    <span className={cat.productCount > 0 ? "text-gray-700 font-medium" : "text-gray-400"}>
                      {cat.productCount ?? 0}{" "}
                      {cat.productCount === 1 ? "product" : "products"}
                    </span>
                  </td>

                  {/* Created date */}
                  <td className="px-5 py-3 text-[#616a7c]">
                    {cat.createdAt ? formatDate(cat.createdAt) : "—"}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        title="Edit"
                        onClick={() => setModal({ open: true, mode: "edit", category: cat })}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <IconEdit />
                      </button>
                      <button
                        title="Delete"
                        onClick={() => setDeleteDialog({ open: true, category: cat })}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <IconTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit modal */}
      {modal.open && (
        <CategoryModal
          mode={modal.mode}
          initial={
            modal.mode === "edit"
              ? { name: modal.category.name, description: modal.category.description }
              : { name: "", description: "" }
          }
          category={modal.mode === "edit" ? modal.category : undefined}
          onClose={() => setModal({ open: false })}
          onSave={handleSave}
          onCategoryUpdated={handleCategoryUpdated}
        />
      )}

      {/* Delete confirmation */}
      {deleteDialog.open && (
        <DeleteDialog
          categoryName={deleteDialog.category.name}
          onClose={() => setDeleteDialog({ open: false })}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
