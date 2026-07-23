"use client";

import { useEffect, useRef, useState } from "react";
import { usePageTitle } from "@/hooks/usePagetitle";
import {
  fetchCategories,
  fetchCategoryById,
  updateCategory,
  getCategoryAssetUploadUrl,
  uploadToS3,
  fetchPadarsByCategory,
  fetchBordersByCategory,
  fetchButtiesByCategory,
  fetchBodyColorsByCategory,
  fetchBorderColorsByCategory,
  createPadar,
  updatePadar,
  deletePadar,
  createBorder,
  updateBorder,
  deleteBorder,
  createButti,
  updateButti,
  deleteButti,
  createBodyColor,
  updateBodyColor,
  deleteBodyColor,
  createBorderColor,
  updateBorderColor,
  deleteBorderColor,
} from "@/lib/api/productApi";
import {
  IconChevronDown,
  IconEdit,
  IconLoader,
  IconPlus,
  IconTrash,
  IconUpload,
  IconEmptyBox,
} from "@/providers/Icons";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Category {
  categoryId: string;
  name: string;
  description?: string;
  baseModelUrl?: string;
}

interface NamedItem {
  id: string;
  name: string;
  modelUrl?: string;
}

interface ColorItem {
  id: string;
  name: string;
  hexCode: string;
}

// ── Shared styles ──────────────────────────────────────────────────────────────

const inputCls =
  "w-full px-3 py-2 text-sm bg-white/60 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:bg-white transition-colors";
const labelCls = "block text-xs font-medium text-gray-500 mb-1.5";

function Select({
  value,
  onChange,
  children,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputCls} pr-8 appearance-none cursor-pointer ${className}`}
      >
        {children}
      </select>
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
        <IconChevronDown />
      </span>
    </div>
  );
}

// ── Inline item form ───────────────────────────────────────────────────────────

function ModelItemForm({
  categoryId,
  initial,
  onSaved,
  onCancel,
  createFn,
  updateFn,
}: {
  categoryId: string;
  initial?: NamedItem;
  onSaved: () => void;
  onCancel: () => void;
  createFn: (data: { name: string; modelUrl: string; categoryId: string }) => Promise<unknown>;
  updateFn: (id: string, data: { name: string; modelUrl: string }) => Promise<unknown>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [modelUrl, setModelUrl] = useState(initial?.modelUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileUpload(file: File) {
    setError("");
    setUploading(true);
    try {
      const { uploadUrl, key } = await getCategoryAssetUploadUrl(file.name, categoryId);
      await uploadToS3(uploadUrl, file);
      setModelUrl(key);
      if (!name) setName(file.name.replace(/\.[^.]+$/, ""));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    setError("");
    if (!name.trim()) return setError("Name is required");
    if (!modelUrl.trim()) return setError("Model URL is required");
    setSaving(true);
    try {
      if (initial) {
        await updateFn(initial.id, { name: name.trim(), modelUrl: modelUrl.trim() });
      } else {
        await createFn({ name: name.trim(), modelUrl: modelUrl.trim(), categoryId });
      }
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white/40 border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
      <input
        ref={fileInputRef}
        type="file"
        accept=".glb,.gltf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFileUpload(f);
          e.target.value = "";
        }}
      />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Peacock Padar"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Model URL (S3) *</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={modelUrl}
              onChange={(e) => setModelUrl(e.target.value)}
              placeholder="Upload a file or paste S3 URL"
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              title="Upload .glb / .gltf file"
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {uploading ? <IconLoader /> : <IconUpload />}
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
          {uploading && (
            <p className="text-xs text-gray-400 mt-1">Uploading to S3...</p>
          )}
          {modelUrl && !uploading && (
            <p className="text-xs text-gray-400 mt-1 truncate" title={modelUrl}>
              {modelUrl}
            </p>
          )}
        </div>
      </div>
      {error && (
        <p className="text-xs text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
          {error}
        </p>
      )}
      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={saving || uploading}
          className="px-4 py-1.5 text-sm font-medium bg-black text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {saving && <IconLoader />}
          {saving ? "Saving..." : initial ? "Update" : "Add"}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-1.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Model item list ────────────────────────────────────────────────────────────

function ModelItemList({
  categoryId,
  items,
  loading,
  onRefresh,
  createFn,
  updateFn,
  deleteFn,
}: {
  categoryId: string;
  items: NamedItem[];
  loading: boolean;
  onRefresh: () => void;
  createFn: (data: { name: string; modelUrl: string; categoryId: string }) => Promise<unknown>;
  updateFn: (id: string, data: { name: string; modelUrl: string }) => Promise<unknown>;
  deleteFn: (id: string) => Promise<unknown>;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteFn(id);
      onRefresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {loading ? (
        <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
          <IconLoader />
          <span className="text-sm">Loading...</span>
        </div>
      ) : items.length === 0 && !showAdd ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2 text-gray-400">
          <IconEmptyBox />
          <p className="text-sm text-gray-500">No items yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-gray-400 bg-gray-50/60">
                <th className="text-left px-4 py-2.5 font-medium">Name</th>
                <th className="text-left px-4 py-2.5 font-medium">Model URL</th>
                <th className="px-4 py-2.5 w-20" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) =>
                editId === item.id ? (
                  <tr key={item.id}>
                    <td colSpan={3} className="px-2 py-2">
                      <ModelItemForm
                        categoryId={categoryId}
                        initial={item}
                        createFn={createFn}
                        updateFn={updateFn}
                        onSaved={() => { setEditId(null); onRefresh(); }}
                        onCancel={() => setEditId(null)}
                      />
                    </td>
                  </tr>
                ) : (
                  <tr key={item.id} className="border-t border-gray-50 hover:bg-white/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate text-xs">{item.modelUrl}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => setEditId(item.id)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <IconEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                        >
                          {deletingId === item.id ? <IconLoader /> : <IconTrash />}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}

      {showAdd ? (
        <ModelItemForm
          categoryId={categoryId}
          createFn={createFn}
          updateFn={updateFn}
          onSaved={() => { setShowAdd(false); onRefresh(); }}
          onCancel={() => setShowAdd(false)}
        />
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 text-sm text-[#616a7c] hover:text-gray-800 transition-colors w-fit"
        >
          <IconPlus /> Add item
        </button>
      )}
    </div>
  );
}

// ── Color item form ────────────────────────────────────────────────────────────

function ColorItemForm({
  categoryId,
  initial,
  onSaved,
  onCancel,
  createFn,
  updateFn,
}: {
  categoryId: string;
  initial?: ColorItem;
  onSaved: () => void;
  onCancel: () => void;
  createFn: (data: { name: string; hexCode: string; categoryId: string }) => Promise<unknown>;
  updateFn: (id: string, data: { name: string; hexCode: string }) => Promise<unknown>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [hexCode, setHexCode] = useState(initial?.hexCode ?? "#000000");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setError("");
    if (!name.trim()) return setError("Name is required");
    setSaving(true);
    try {
      if (initial) {
        await updateFn(initial.id, { name: name.trim(), hexCode });
      } else {
        await createFn({ name: name.trim(), hexCode, categoryId });
      }
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white/40 border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-3 items-end">
        <div className="col-span-2">
          <label className={labelCls}>Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Royal Blue"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Hex Color *</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={hexCode}
              onChange={(e) => setHexCode(e.target.value)}
              className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white/60"
            />
            <input
              type="text"
              value={hexCode}
              onChange={(e) => setHexCode(e.target.value)}
              placeholder="#000000"
              className={`${inputCls} font-mono`}
            />
          </div>
        </div>
      </div>
      {error && (
        <p className="text-xs text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
          {error}
        </p>
      )}
      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-1.5 text-sm font-medium bg-black text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {saving && <IconLoader />}
          {saving ? "Saving..." : initial ? "Update" : "Add"}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-1.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Color item list ────────────────────────────────────────────────────────────

function ColorItemList({
  categoryId,
  items,
  loading,
  onRefresh,
  createFn,
  updateFn,
  deleteFn,
}: {
  categoryId: string;
  items: ColorItem[];
  loading: boolean;
  onRefresh: () => void;
  createFn: (data: { name: string; hexCode: string; categoryId: string }) => Promise<unknown>;
  updateFn: (id: string, data: { name: string; hexCode: string }) => Promise<unknown>;
  deleteFn: (id: string) => Promise<unknown>;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteFn(id);
      onRefresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {loading ? (
        <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
          <IconLoader />
          <span className="text-sm">Loading...</span>
        </div>
      ) : items.length === 0 && !showAdd ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2 text-gray-400">
          <IconEmptyBox />
          <p className="text-sm text-gray-500">No colors yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-gray-400 bg-gray-50/60">
                <th className="text-left px-4 py-2.5 font-medium">Color</th>
                <th className="text-left px-4 py-2.5 font-medium">Name</th>
                <th className="text-left px-4 py-2.5 font-medium">Hex</th>
                <th className="px-4 py-2.5 w-20" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) =>
                editId === item.id ? (
                  <tr key={item.id}>
                    <td colSpan={4} className="px-2 py-2">
                      <ColorItemForm
                        categoryId={categoryId}
                        initial={item}
                        createFn={createFn}
                        updateFn={updateFn}
                        onSaved={() => { setEditId(null); onRefresh(); }}
                        onCancel={() => setEditId(null)}
                      />
                    </td>
                  </tr>
                ) : (
                  <tr key={item.id} className="border-t border-gray-50 hover:bg-white/40 transition-colors">
                    <td className="px-4 py-3">
                      <span
                        className="w-7 h-7 rounded-full border border-gray-200 inline-block shadow-sm"
                        style={{ background: item.hexCode }}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.hexCode}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => setEditId(item.id)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <IconEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                        >
                          {deletingId === item.id ? <IconLoader /> : <IconTrash />}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}

      {showAdd ? (
        <ColorItemForm
          categoryId={categoryId}
          createFn={createFn}
          updateFn={updateFn}
          onSaved={() => { setShowAdd(false); onRefresh(); }}
          onCancel={() => setShowAdd(false)}
        />
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 text-sm text-[#616a7c] hover:text-gray-800 transition-colors w-fit"
        >
          <IconPlus /> Add color
        </button>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

type Tab = "padars" | "borders" | "buttis";

export default function AssetsPage() {
  const title = usePageTitle();

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("padars");

  // Base model URL
  const [categoryData, setCategoryData] = useState<Category | null>(null);
  const [baseModelUrl, setBaseModelUrl] = useState("");
  const [baseModelUploading, setBaseModelUploading] = useState(false);
  const [baseModelSaving, setBaseModelSaving] = useState(false);
  const [baseModelError, setBaseModelError] = useState("");
  const [baseModelSuccess, setBaseModelSuccess] = useState(false);
  const baseModelFileRef = useRef<HTMLInputElement>(null);

  // Data
  const [padars, setPadars] = useState<NamedItem[]>([]);
  const [borders, setBorders] = useState<NamedItem[]>([]);
  const [buttis, setButtis] = useState<NamedItem[]>([]);
  const [bodyColors, setBodyColors] = useState<ColorItem[]>([]);
  const [borderColors, setBorderColors] = useState<ColorItem[]>([]);

  // Loading states
  const [tabLoading, setTabLoading] = useState(false);
  const [bodyColorLoading, setBodyColorLoading] = useState(false);
  const [borderColorLoading, setBorderColorLoading] = useState(false);

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  // Fetch all data when category changes
  useEffect(() => {
    if (!selectedCategoryId) {
      setCategoryData(null);
      setBaseModelUrl("");
      return;
    }
    fetchCategoryById(selectedCategoryId)
      .then((cat: Category) => {
        setCategoryData(cat);
        setBaseModelUrl(cat.baseModelUrl ?? "");
      })
      .catch(() => {});
    fetchTabData(activeTab);
    fetchColors();
  }, [selectedCategoryId]);

  async function handleBaseModelUpload(file: File) {
    setBaseModelError("");
    setBaseModelUploading(true);
    try {
      const { uploadUrl, key } = await getCategoryAssetUploadUrl(file.name, selectedCategoryId);
      await uploadToS3(uploadUrl, file);
      setBaseModelUrl(key);
    } catch (err: unknown) {
      setBaseModelError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBaseModelUploading(false);
    }
  }

  async function handleSaveBaseModel() {
    if (!categoryData) return;
    setBaseModelError("");
    setBaseModelSuccess(false);
    setBaseModelSaving(true);
    try {
      await updateCategory(selectedCategoryId, {
        name: categoryData.name,
        description: categoryData.description ?? "",
        baseModelUrl: baseModelUrl.trim() || undefined,
      });
      setBaseModelSuccess(true);
      setTimeout(() => setBaseModelSuccess(false), 3000);
    } catch (err: unknown) {
      setBaseModelError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setBaseModelSaving(false);
    }
  }

  // Fetch tab data when tab changes
  useEffect(() => {
    if (!selectedCategoryId) return;
    fetchTabData(activeTab);
  }, [activeTab]);

  async function fetchTabData(tab: Tab) {
    setTabLoading(true);
    try {
      if (tab === "padars") {
        const data = await fetchPadarsByCategory(selectedCategoryId).catch(() => []);
        setPadars(data);
      } else if (tab === "borders") {
        const data = await fetchBordersByCategory(selectedCategoryId).catch(() => []);
        setBorders(data);
      } else {
        const data = await fetchButtiesByCategory(selectedCategoryId).catch(() => []);
        setButtis(data);
      }
    } finally {
      setTabLoading(false);
    }
  }

  async function fetchColors() {
    setBodyColorLoading(true);
    setBorderColorLoading(true);
    fetchBodyColorsByCategory(selectedCategoryId)
      .then(setBodyColors)
      .catch(() => setBodyColors([]))
      .finally(() => setBodyColorLoading(false));
    fetchBorderColorsByCategory(selectedCategoryId)
      .then(setBorderColors)
      .catch(() => setBorderColors([]))
      .finally(() => setBorderColorLoading(false));
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "padars", label: "Padars" },
    { key: "borders", label: "Borders" },
    { key: "buttis", label: "Buttis" },
  ];

  return (
    <div className="flex flex-col gap-6 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
      </div>

      {/* Category selector */}
      <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl p-5">
        <label className={labelCls}>Select Category</label>
        <div className="max-w-xs">
          <Select value={selectedCategoryId} onChange={setSelectedCategoryId}>
            <option value="">Choose a category...</option>
            {categories.map((c) => (
              <option key={c.categoryId} value={c.categoryId}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {selectedCategoryId && (
        <>
          {/* Base Model URL */}
          <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm font-semibold text-gray-700">Base Model URL</span>
              <div className="flex-1 h-[0.5px] bg-gray-100" />
            </div>
            <input
              ref={baseModelFileRef}
              type="file"
              accept=".glb,.gltf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleBaseModelUpload(f);
                e.target.value = "";
              }}
            />
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className={labelCls}>S3 URL for the base 3D model of this category</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={baseModelUrl}
                    onChange={(e) => setBaseModelUrl(e.target.value)}
                    placeholder="Upload a file or paste S3 URL"
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={() => baseModelFileRef.current?.click()}
                    disabled={baseModelUploading}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {baseModelUploading ? <IconLoader /> : <IconUpload />}
                    {baseModelUploading ? "Uploading..." : "Upload"}
                  </button>
                </div>
                {baseModelUploading && (
                  <p className="text-xs text-gray-400 mt-1">Uploading to S3...</p>
                )}
                {baseModelUrl && !baseModelUploading && (
                  <p className="text-xs text-gray-400 mt-1 truncate" title={baseModelUrl}>
                    {baseModelUrl}
                  </p>
                )}
              </div>
              <button
                onClick={handleSaveBaseModel}
                disabled={baseModelSaving || baseModelUploading}
                className="px-4 py-2 text-sm font-medium bg-black text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2 shrink-0"
              >
                {baseModelSaving && <IconLoader />}
                {baseModelSaving ? "Saving..." : "Save"}
              </button>
            </div>
            {baseModelError && (
              <p className="text-xs text-red-500 mt-2">{baseModelError}</p>
            )}
            {baseModelSuccess && (
              <p className="text-xs text-emerald-600 mt-2">Base model URL saved.</p>
            )}
          </div>

          {/* 3D Assets tabs */}
          <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl p-5 flex flex-col gap-5">
            <div className="flex items-center gap-1 border-b border-gray-100 pb-4">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                    activeTab === tab.key
                      ? "bg-black text-white"
                      : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "padars" && (
              <ModelItemList
                categoryId={selectedCategoryId}
                items={padars}
                loading={tabLoading}
                onRefresh={() => fetchTabData("padars")}
                createFn={createPadar}
                updateFn={updatePadar}
                deleteFn={deletePadar}
              />
            )}
            {activeTab === "borders" && (
              <ModelItemList
                categoryId={selectedCategoryId}
                items={borders}
                loading={tabLoading}
                onRefresh={() => fetchTabData("borders")}
                createFn={createBorder}
                updateFn={updateBorder}
                deleteFn={deleteBorder}
              />
            )}
            {activeTab === "buttis" && (
              <ModelItemList
                categoryId={selectedCategoryId}
                items={buttis}
                loading={tabLoading}
                onRefresh={() => fetchTabData("buttis")}
                createFn={createButti}
                updateFn={updateButti}
                deleteFn={deleteButti}
              />
            )}
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-4">
            {/* Body Colors */}
            <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-700">Body Colors</span>
                <div className="flex-1 h-[0.5px] bg-gray-100" />
              </div>
              <ColorItemList
                categoryId={selectedCategoryId}
                items={bodyColors}
                loading={bodyColorLoading}
                onRefresh={() => {
                  setBodyColorLoading(true);
                  fetchBodyColorsByCategory(selectedCategoryId)
                    .then(setBodyColors)
                    .catch(() => setBodyColors([]))
                    .finally(() => setBodyColorLoading(false));
                }}
                createFn={createBodyColor}
                updateFn={updateBodyColor}
                deleteFn={deleteBodyColor}
              />
            </div>

            {/* Border Colors */}
            <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-700">Border Colors</span>
                <div className="flex-1 h-[0.5px] bg-gray-100" />
              </div>
              <ColorItemList
                categoryId={selectedCategoryId}
                items={borderColors}
                loading={borderColorLoading}
                onRefresh={() => {
                  setBorderColorLoading(true);
                  fetchBorderColorsByCategory(selectedCategoryId)
                    .then(setBorderColors)
                    .catch(() => setBorderColors([]))
                    .finally(() => setBorderColorLoading(false));
                }}
                createFn={createBorderColor}
                updateFn={updateBorderColor}
                deleteFn={deleteBorderColor}
              />
            </div>
          </div>
        </>
      )}

      {!selectedCategoryId && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400 bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl">
          <IconEmptyBox />
          <p className="text-sm font-medium text-gray-600">Select a category to manage its assets</p>
          <p className="text-xs text-gray-400">Padars, Borders, Buttis, and Colors are organized per category</p>
        </div>
      )}
    </div>
  );
}
