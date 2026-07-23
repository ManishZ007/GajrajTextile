"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageTitle } from "@/hooks/usePagetitle";
import { useProductStore } from "@/stores/useProductStore";
import {
  fetchCategories,
  fetchCategoryById,
  fetchPadarsByCategory,
  fetchBordersByCategory,
  fetchButtiesByCategory,
  fetchBodyColorsByCategory,
  fetchBorderColorsByCategory,
  getUploadUrls,
  uploadToS3,
  createProduct,
} from "@/lib/api/productApi";
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconEye,
  IconEyeOff,
  IconLoader,
  IconPlus,
  IconStar,
  IconTrash,
  IconUpload,
} from "@/providers/Icons";

// ── Shared styles ──────────────────────────────────────────────────────────────

const inputCls =
  "w-full px-3 py-2 text-sm bg-white/60 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:bg-white transition-colors";
const selectCls = `${inputCls} appearance-none cursor-pointer`;
const labelCls = "block text-xs font-medium text-gray-500 mb-1.5";

function SectionHeading({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-sm font-semibold text-gray-700">{title}</span>
      <div className="flex-1 h-[0.5px] bg-gray-100" />
    </div>
  );
}

function Select({
  children,
  className = "",
  value,
  onChange,
}: {
  children: React.ReactNode;
  className?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}) {
  return (
    <div className="relative">
      <select
        className={`${selectCls} pr-8 ${className}`}
        value={value}
        onChange={onChange}
      >
        {children}
      </select>
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
        <IconChevronDown />
      </span>
    </div>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────────

interface Category {
  categoryId: string;
  name: string;
  customizable?: boolean;
}

interface NamedItem {
  id: string;
  name: string;
}

interface DefaultConfig {
  defaultPadarId: string;
  defaultBorderId: string;
  defaultButtiId: string;
  defaultBodyColorId: string;
  defaultBorderColorId: string;
  defaultZari: string;
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ProductsAdd() {
  const title = usePageTitle();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [error, setError] = useState("");

  // Default config state
  const [categoryCustomizable, setCategoryCustomizable] = useState<boolean | null>(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [padars, setPadars] = useState<NamedItem[]>([]);
  const [borders, setBorders] = useState<NamedItem[]>([]);
  const [buttis, setButtis] = useState<NamedItem[]>([]);
  const [bodyColors, setBodyColors] = useState<NamedItem[]>([]);
  const [borderColors, setBorderColors] = useState<NamedItem[]>([]);
  const [defaultConfig, setDefaultConfig] = useState<DefaultConfig>({
    defaultPadarId: "",
    defaultBorderId: "",
    defaultButtiId: "",
    defaultBodyColorId: "",
    defaultBorderColorId: "",
    defaultZari: "",
  });

  const {
    name,
    categoryId,
    basePrice,
    description,
    status,
    variants,
    attributes,
    images,
    saving,
    setField,
    addVariant,
    updateVariant,
    removeVariant,
    addAttribute,
    updateAttribute,
    removeAttribute,
    addImages,
    removeImage,
    setPrimaryImage,
    updateImage,
    setSaving,
    reset,
  } = useProductStore();

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.preview));
    };
  }, []);

  // When category changes, fetch category details + customization options
  useEffect(() => {
    if (!categoryId) {
      setCategoryCustomizable(null);
      return;
    }
    setConfigLoading(true);
    fetchCategoryById(categoryId)
      .then(async (cat) => {
        setCategoryCustomizable(!!cat.customizable);
        if (cat.customizable) {
          const [p, b, bu, bc, brc] = await Promise.all([
            fetchPadarsByCategory(categoryId).catch(() => []),
            fetchBordersByCategory(categoryId).catch(() => []),
            fetchButtiesByCategory(categoryId).catch(() => []),
            fetchBodyColorsByCategory(categoryId).catch(() => []),
            fetchBorderColorsByCategory(categoryId).catch(() => []),
          ]);
          setPadars(p);
          setBorders(b);
          setButtis(bu);
          setBodyColors(bc);
          setBorderColors(brc);
        }
      })
      .catch(() => setCategoryCustomizable(false))
      .finally(() => setConfigLoading(false));

    // Reset config when category changes
    setDefaultConfig({
      defaultPadarId: "",
      defaultBorderId: "",
      defaultButtiId: "",
      defaultBodyColorId: "",
      defaultBorderColorId: "",
      defaultZari: "",
    });
  }, [categoryId]);

  function setConfig(field: keyof DefaultConfig, value: string) {
    setDefaultConfig((prev) => ({ ...prev, [field]: value }));
  }

  function handleFileSelect(files: FileList | null) {
    if (!files) return;
    const fileArray = Array.from(files).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (fileArray.length > 0) addImages(fileArray);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  }

  async function uploadImages(): Promise<
    { imageUrl: string; isPrimary: boolean; displayOrder: number }[]
  > {
    const unuploaded = images.filter((img) => !img.uploaded);
    if (unuploaded.length === 0) {
      return images.map((img, i) => ({
        imageUrl: img.s3Key,
        isPrimary: img.isPrimary,
        displayOrder: i,
      }));
    }

    const category = categories.find((c) => c.categoryId === categoryId);
    const categoryPrefix = category
      ? category.name.toLowerCase().replace(/\s+/g, "-")
      : "products";

    const fileNames = unuploaded.map((img) => img.file!.name);
    const urls = await getUploadUrls(categoryPrefix, fileNames);

    let urlIndex = 0;
    for (let i = 0; i < images.length; i++) {
      if (images[i].uploaded) continue;
      const { uploadUrl, key } = urls[urlIndex];
      updateImage(i, { uploading: true });
      await uploadToS3(uploadUrl, images[i].file!);
      updateImage(i, { uploading: false, uploaded: true, s3Key: key });
      urlIndex++;
    }

    const currentImages = useProductStore.getState().images;
    return currentImages.map((img, i) => ({
      imageUrl: img.s3Key,
      isPrimary: img.isPrimary,
      displayOrder: i,
    }));
  }

  async function handleSave() {
    setError("");
    if (!name.trim()) return setError("Product name is required");
    if (!categoryId) return setError("Select a category");
    if (!basePrice) return setError("Base price is required");

    setSaving(true);
    try {
      const imageData = await uploadImages();
      await createProduct({
        name,
        categoryId,
        basePrice: parseFloat(basePrice),
        description,
        status,
        variants: variants
          .filter((v) => v.color || v.size)
          .map((v) => ({
            size: v.size,
            color: v.color,
            price: parseFloat(v.price) || 0,
            stockQuantity: parseInt(v.stock) || 0,
            sku: v.sku,
            status: v.status,
          })),
        attributes: attributes
          .filter((a) => a.key && a.value)
          .map((a) => ({ attributeKey: a.key, attributeValue: a.value })),
        images: imageData,
        ...(categoryCustomizable
          ? {
              defaultPadarId: defaultConfig.defaultPadarId || null,
              defaultBorderId: defaultConfig.defaultBorderId || null,
              defaultButtiId: defaultConfig.defaultButtiId || null,
              defaultBodyColorId: defaultConfig.defaultBodyColorId || null,
              defaultBorderColorId: defaultConfig.defaultBorderColorId || null,
              defaultZari: defaultConfig.defaultZari || null,
            }
          : {}),
      });
      reset();
      router.push("/products");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save product");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 min-h-full">
      {/* Header */}
      <div className="flex items-start justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
        <button
          onClick={() => setShowPreview((p) => !p)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
            showPreview
              ? "bg-black text-white border-black"
              : "bg-white/60 text-gray-600 border-gray-200 hover:border-gray-300"
          }`}
        >
          {showPreview ? <IconEye /> : <IconEyeOff />}
          {showPreview ? "Hide preview" : "Show preview"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Main content */}
      <div
        className={`grid gap-4 ${showPreview ? "grid-cols-[1fr_auto]" : "grid-cols-1"}`}
      >
        {/* Left: form */}
        <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl p-6 flex flex-col gap-6">
          {/* Product details */}
          <div>
            <SectionHeading title="Product details" />
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={labelCls}>Product name</label>
                <input
                  type="text"
                  placeholder="e.g. Traditional Paithani Saree"
                  className={inputCls}
                  value={name}
                  onChange={(e) => setField("name", e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Category</label>
                <Select
                  value={categoryId}
                  onChange={(e) => setField("categoryId", e.target.value)}
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.categoryId} value={c.categoryId}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className={labelCls}>Base price (₹)</label>
                <input
                  type="number"
                  placeholder="0"
                  className={inputCls}
                  value={basePrice}
                  onChange={(e) => setField("basePrice", e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Description</label>
                <textarea
                  rows={3}
                  placeholder="Write a short product description..."
                  className={`${inputCls} resize-none`}
                  value={description}
                  onChange={(e) => setField("description", e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Status</label>
                <Select
                  value={status}
                  onChange={(e) => setField("status", e.target.value)}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="OUT_OF_STOCK">Out of stock</option>
                </Select>
              </div>
            </div>
          </div>

          {/* Default Configuration (only when category is customizable) */}
          {categoryId && configLoading && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <IconLoader />
              Loading category options...
            </div>
          )}
          {categoryCustomizable === true && !configLoading && (
            <div>
              <SectionHeading title="Default Configuration" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Default Padar</label>
                  <Select
                    value={defaultConfig.defaultPadarId}
                    onChange={(e) => setConfig("defaultPadarId", e.target.value)}
                  >
                    <option value="">None</option>
                    {padars.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className={labelCls}>Default Border</label>
                  <Select
                    value={defaultConfig.defaultBorderId}
                    onChange={(e) => setConfig("defaultBorderId", e.target.value)}
                  >
                    <option value="">None</option>
                    {borders.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className={labelCls}>Default Butti</label>
                  <Select
                    value={defaultConfig.defaultButtiId}
                    onChange={(e) => setConfig("defaultButtiId", e.target.value)}
                  >
                    <option value="">None</option>
                    {buttis.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className={labelCls}>Default Body Color</label>
                  <Select
                    value={defaultConfig.defaultBodyColorId}
                    onChange={(e) => setConfig("defaultBodyColorId", e.target.value)}
                  >
                    <option value="">None</option>
                    {bodyColors.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className={labelCls}>Default Border Color</label>
                  <Select
                    value={defaultConfig.defaultBorderColorId}
                    onChange={(e) => setConfig("defaultBorderColorId", e.target.value)}
                  >
                    <option value="">None</option>
                    {borderColors.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className={labelCls}>Default Zari</label>
                  <Select
                    value={defaultConfig.defaultZari}
                    onChange={(e) => setConfig("defaultZari", e.target.value)}
                  >
                    <option value="">None</option>
                    <option value="GOLD">GOLD</option>
                    <option value="SILVER">SILVER</option>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Variants */}
          <div>
            <SectionHeading title="Variants" />
            {variants.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wide text-gray-400 bg-gray-50/60">
                      <th className="text-left px-3 py-2.5 font-medium">Size</th>
                      <th className="text-left px-3 py-2.5 font-medium">Color</th>
                      <th className="text-left px-3 py-2.5 font-medium">Price (₹)</th>
                      <th className="text-left px-3 py-2.5 font-medium">Stock</th>
                      <th className="text-left px-3 py-2.5 font-medium">SKU</th>
                      <th className="text-left px-3 py-2.5 font-medium">Status</th>
                      <th className="px-3 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v, i) => (
                      <tr key={i} className="border-t border-gray-50">
                        <td className="px-2 py-2">
                          <input
                            value={v.size}
                            onChange={(e) =>
                              updateVariant(i, "size", e.target.value)
                            }
                            placeholder="S/M/L"
                            className={`${inputCls} w-16`}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            value={v.color}
                            onChange={(e) =>
                              updateVariant(i, "color", e.target.value)
                            }
                            placeholder="Color"
                            className={`${inputCls} w-24`}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            value={v.price}
                            onChange={(e) =>
                              updateVariant(i, "price", e.target.value)
                            }
                            type="number"
                            placeholder="0"
                            className={`${inputCls} w-24`}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            value={v.stock}
                            onChange={(e) =>
                              updateVariant(i, "stock", e.target.value)
                            }
                            type="number"
                            placeholder="0"
                            className={`${inputCls} w-16`}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            value={v.sku}
                            onChange={(e) =>
                              updateVariant(i, "sku", e.target.value)
                            }
                            placeholder="SKU-001"
                            className={`${inputCls} w-32`}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <Select
                            value={v.status}
                            onChange={(e) =>
                              updateVariant(i, "status", e.target.value)
                            }
                            className="w-32"
                          >
                            <option value="ACTIVE">Active</option>
                            <option value="OUT_OF_STOCK">Out of stock</option>
                          </Select>
                        </td>
                        <td className="px-2 py-2">
                          <button
                            onClick={() => removeVariant(i)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <IconTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <button
              onClick={addVariant}
              className="mt-3 flex items-center gap-1.5 text-sm text-[#616a7c] hover:text-gray-800 transition-colors"
            >
              <IconPlus /> Add variant
            </button>
          </div>

          {/* Attributes */}
          <div>
            <SectionHeading title="Attributes" />
            <div className="flex flex-col gap-2">
              {attributes.map((attr, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={attr.key}
                    onChange={(e) => updateAttribute(i, "key", e.target.value)}
                    placeholder="Key (e.g. fabric)"
                    className={`${inputCls} flex-1`}
                  />
                  <input
                    value={attr.value}
                    onChange={(e) =>
                      updateAttribute(i, "value", e.target.value)
                    }
                    placeholder="Value (e.g. pure silk)"
                    className={`${inputCls} flex-1`}
                  />
                  <button
                    onClick={() => removeAttribute(i)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                  >
                    <IconTrash />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addAttribute}
              className="mt-3 flex items-center gap-1.5 text-sm text-[#616a7c] hover:text-gray-800 transition-colors"
            >
              <IconPlus /> Add attribute
            </button>
          </div>

          {/* Images */}
          <div>
            <SectionHeading title="Images" />
            <label
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer bg-white/30 hover:bg-white/50 hover:border-gray-300 transition-all"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
              />
              <span className="text-gray-300 mb-2">
                <IconUpload />
              </span>
              <span className="text-sm text-gray-500">
                Drop images here or{" "}
                <span className="font-medium text-gray-700">
                  click to upload
                </span>
              </span>
              <span className="text-xs text-gray-400 mt-1">
                PNG, JPG up to 10MB each
              </span>
            </label>

            {images.length > 0 && (
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {images.map((img, i) => (
                  <div
                    key={i}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 cursor-pointer group ${
                      img.isPrimary ? "border-gray-800" : "border-gray-200"
                    }`}
                    onClick={() => setPrimaryImage(i)}
                  >
                    <img
                      src={img.preview}
                      alt={`Image ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {img.isPrimary && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 text-white flex items-center justify-center">
                        <IconStar />
                      </span>
                    )}
                    {img.uploading && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <IconLoader />
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(i);
                      }}
                      className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-red-500 text-white items-center justify-center text-xs hidden group-hover:flex"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 hover:border-gray-300 hover:text-gray-600 transition-colors"
                >
                  <IconPlus />
                </button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              onClick={() => {
                reset();
                router.push("/products");
              }}
              className="px-5 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 text-sm font-medium bg-black text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving && <IconLoader />}
              {saving ? "Saving..." : "Save product"}
            </button>
          </div>
        </div>

        {/* Right: preview */}
        {showPreview && (
          <div className="w-72">
            <div className="sticky top-6 bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl overflow-hidden flex flex-col">
              {/* Image carousel */}
              <div className="relative bg-gray-100 aspect-square flex items-center justify-center overflow-hidden">
                {images.length > 0 ? (
                  <img
                    src={images[previewIndex]?.preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs text-gray-400">No image</span>
                )}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setPreviewIndex(
                          (p) => (p - 1 + images.length) % images.length,
                        )
                      }
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-white transition-colors"
                    >
                      <IconChevronLeft />
                    </button>
                    <button
                      onClick={() =>
                        setPreviewIndex((p) => (p + 1) % images.length)
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-white transition-colors"
                    >
                      <IconChevronRight />
                    </button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                      {images.map((_, d) => (
                        <span
                          key={d}
                          className={`w-1.5 h-1.5 rounded-full ${d === previewIndex ? "bg-gray-700" : "bg-gray-300"}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Product info */}
              <div className="p-4 flex flex-col gap-2.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-gray-800 leading-tight">
                    {name || "Product name"}
                  </h3>
                  <span
                    className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      status === "ACTIVE"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {status === "ACTIVE" ? "Active" : "Out of stock"}
                  </span>
                </div>

                <p className="text-xs text-[#616a7c] leading-relaxed line-clamp-2">
                  {description || "No description yet"}
                </p>

                {categoryId && (
                  <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 w-fit">
                    {categories.find((c) => c.categoryId === categoryId)?.name}
                  </span>
                )}

                <p className="text-lg font-bold text-gray-800">
                  {basePrice
                    ? `₹${parseFloat(basePrice).toLocaleString("en-IN")}`
                    : "₹0"}
                </p>

                {variants.length > 0 && (
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-[10px] text-gray-400 mb-1">Variants</p>
                    <div className="flex flex-wrap gap-1">
                      {variants
                        .filter((v) => v.color || v.size)
                        .map((v, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
                          >
                            {[v.size, v.color].filter(Boolean).join(" / ")}
                          </span>
                        ))}
                    </div>
                  </div>
                )}

                {attributes.length > 0 && (
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-[10px] text-gray-400 mb-1">Attributes</p>
                    {attributes
                      .filter((a) => a.key && a.value)
                      .map((a, i) => (
                        <div
                          key={i}
                          className="flex justify-between text-[11px]"
                        >
                          <span className="text-gray-500">{a.key}</span>
                          <span className="text-gray-700">{a.value}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
