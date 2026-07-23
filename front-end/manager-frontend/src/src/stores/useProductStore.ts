import { create } from "zustand";

export interface Variant {
  size: string;
  price: string;
  color: string;
  stock: string;
  sku: string;
  status: string;
}

export interface Attribute {
  key: string;
  value: string;
}

export interface ProductImage {
  file: File | null;
  preview: string;
  s3Key: string;
  isPrimary: boolean;
  uploading: boolean;
  uploaded: boolean;
}

export interface OptionValue {
  valueName: string;
  colorCode: string;
  textureUrl: string;
  modelUrl: string;
  previewImageUrl: string;
  isDefault: boolean;
  displayOrder: number;
  priceAdjustment: string;
}

export interface CustomOption {
  name: string;
  type: string; // COLOR | TEXTURE | MODEL | BOOLEAN
  meshName: string;
  displayOrder: number;
  values: OptionValue[];
}

interface ProductState {
  name: string;
  categoryId: string;
  basePrice: string;
  description: string;
  status: string;
  variants: Variant[];
  attributes: Attribute[];
  images: ProductImage[];
  customOptions: CustomOption[];
  saving: boolean;

  setField: (field: string, value: string) => void;

  addVariant: () => void;
  updateVariant: (index: number, field: keyof Variant, value: string) => void;
  removeVariant: (index: number) => void;

  addAttribute: () => void;
  updateAttribute: (index: number, field: "key" | "value", value: string) => void;
  removeAttribute: (index: number) => void;

  addImages: (files: File[]) => void;
  removeImage: (index: number) => void;
  setPrimaryImage: (index: number) => void;
  updateImage: (index: number, updates: Partial<ProductImage>) => void;

  addCustomOption: () => void;
  updateCustomOption: (index: number, field: keyof CustomOption, value: string | number) => void;
  removeCustomOption: (index: number) => void;
  addOptionValue: (optionIndex: number) => void;
  updateOptionValue: (
    optionIndex: number,
    valueIndex: number,
    field: keyof OptionValue,
    value: string | boolean | number,
  ) => void;
  removeOptionValue: (optionIndex: number, valueIndex: number) => void;
  setDefaultValue: (optionIndex: number, valueIndex: number) => void;

  setSaving: (saving: boolean) => void;
  reset: () => void;
  populateForm: (dto: any) => void;
}

const BLANK_OPTION_VALUE: OptionValue = {
  valueName: "",
  colorCode: "",
  textureUrl: "",
  modelUrl: "",
  previewImageUrl: "",
  isDefault: false,
  displayOrder: 0,
  priceAdjustment: "0",
};

const initialState = {
  name: "",
  categoryId: "",
  basePrice: "",
  description: "",
  status: "ACTIVE",
  variants: [] as Variant[],
  attributes: [] as Attribute[],
  images: [] as ProductImage[],
  customOptions: [] as CustomOption[],
  saving: false,
};

export const useProductStore = create<ProductState>((set) => ({
  ...initialState,

  setField: (field, value) => set({ [field]: value }),

  // ── Variants ────────────────────────────────────────────────────────────────

  addVariant: () =>
    set((s) => ({
      variants: [
        ...s.variants,
        { size: "", color: "", price: "", stock: "", sku: "", status: "ACTIVE" },
      ],
    })),
  updateVariant: (index, field, value) =>
    set((s) => ({
      variants: s.variants.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    })),
  removeVariant: (index) =>
    set((s) => ({ variants: s.variants.filter((_, i) => i !== index) })),

  // ── Attributes ──────────────────────────────────────────────────────────────

  addAttribute: () =>
    set((s) => ({ attributes: [...s.attributes, { key: "", value: "" }] })),
  updateAttribute: (index, field, value) =>
    set((s) => ({
      attributes: s.attributes.map((a, i) => (i === index ? { ...a, [field]: value } : a)),
    })),
  removeAttribute: (index) =>
    set((s) => ({ attributes: s.attributes.filter((_, i) => i !== index) })),

  // ── Images ──────────────────────────────────────────────────────────────────

  addImages: (files) =>
    set((s) => ({
      images: [
        ...s.images,
        ...files.map((file, i) => ({
          file,
          preview: URL.createObjectURL(file),
          s3Key: "",
          isPrimary: s.images.length === 0 && i === 0,
          uploading: false,
          uploaded: false,
        })),
      ],
    })),
  removeImage: (index) =>
    set((s) => {
      const updated = s.images.filter((_, i) => i !== index);
      if (updated.length > 0 && !updated.some((img) => img.isPrimary)) {
        updated[0].isPrimary = true;
      }
      return { images: updated };
    }),
  setPrimaryImage: (index) =>
    set((s) => ({
      images: s.images.map((img, i) => ({ ...img, isPrimary: i === index })),
    })),
  updateImage: (index, updates) =>
    set((s) => ({
      images: s.images.map((img, i) => (i === index ? { ...img, ...updates } : img)),
    })),

  // ── Custom options ───────────────────────────────────────────────────────────

  addCustomOption: () =>
    set((s) => ({
      customOptions: [
        ...s.customOptions,
        { name: "", type: "COLOR", meshName: "", displayOrder: s.customOptions.length, values: [] },
      ],
    })),

  updateCustomOption: (index, field, value) =>
    set((s) => ({
      customOptions: s.customOptions.map((opt, i) =>
        i === index ? { ...opt, [field]: value } : opt,
      ),
    })),

  removeCustomOption: (index) =>
    set((s) => ({ customOptions: s.customOptions.filter((_, i) => i !== index) })),

  addOptionValue: (optionIndex) =>
    set((s) => ({
      customOptions: s.customOptions.map((opt, i) =>
        i === optionIndex
          ? {
              ...opt,
              values: [
                ...opt.values,
                {
                  ...BLANK_OPTION_VALUE,
                  displayOrder: opt.values.length,
                  isDefault: opt.values.length === 0, // first value is default
                },
              ],
            }
          : opt,
      ),
    })),

  updateOptionValue: (optionIndex, valueIndex, field, value) =>
    set((s) => ({
      customOptions: s.customOptions.map((opt, i) =>
        i === optionIndex
          ? {
              ...opt,
              values: opt.values.map((v, j) =>
                j === valueIndex ? { ...v, [field]: value } : v,
              ),
            }
          : opt,
      ),
    })),

  removeOptionValue: (optionIndex, valueIndex) =>
    set((s) => ({
      customOptions: s.customOptions.map((opt, i) => {
        if (i !== optionIndex) return opt;
        const updated = opt.values.filter((_, j) => j !== valueIndex);
        // ensure at least one default
        if (updated.length > 0 && !updated.some((v) => v.isDefault)) {
          updated[0] = { ...updated[0], isDefault: true };
        }
        return { ...opt, values: updated };
      }),
    })),

  setDefaultValue: (optionIndex, valueIndex) =>
    set((s) => ({
      customOptions: s.customOptions.map((opt, i) =>
        i === optionIndex
          ? {
              ...opt,
              values: opt.values.map((v, j) => ({ ...v, isDefault: j === valueIndex })),
            }
          : opt,
      ),
    })),

  // ── Meta ─────────────────────────────────────────────────────────────────────

  setSaving: (saving) => set({ saving }),
  reset: () => set(initialState),

  populateForm: (dto) =>
    set({
      name: dto.name ?? "",
      categoryId: dto.category?.categoryId ?? "",
      basePrice: String(dto.basePrice ?? ""),
      description: dto.description ?? "",
      status: dto.status ?? "ACTIVE",
      variants: (dto.variants ?? []).map((v: any) => ({
        size: v.size ?? "",
        color: v.color ?? "",
        price: String(v.price ?? ""),
        stock: String(v.stockQuantity ?? ""),
        sku: v.sku ?? "",
        status: v.status ?? "ACTIVE",
      })),
      attributes: (dto.attributes ?? []).map((a: any) => ({
        key: a.attributeKey ?? "",
        value: a.attributeValue ?? "",
      })),
      images: (dto.images ?? [])
        .sort((a: any, b: any) => a.displayOrder - b.displayOrder)
        .map((img: any) => ({
          file: null,
          preview: img.imageUrl,
          s3Key: extractS3Key(img.imageUrl),
          isPrimary: img.isPrimary,
          uploading: false,
          uploaded: true,
        })),
      customOptions: (dto.customOptions ?? [])
        .sort((a: any, b: any) => a.displayOrder - b.displayOrder)
        .map((opt: any, oi: number) => ({
          name: opt.name ?? "",
          type: opt.type ?? "COLOR",
          meshName: opt.meshName ?? "",
          displayOrder: opt.displayOrder ?? oi,
          values: (opt.values ?? [])
            .sort((a: any, b: any) => a.displayOrder - b.displayOrder)
            .map((v: any, vi: number) => ({
              valueName: v.valueName ?? "",
              colorCode: v.colorCode ?? "",
              textureUrl: v.textureUrl ?? "",
              modelUrl: v.modelUrl ?? "",
              previewImageUrl: v.previewImageUrl ?? "",
              isDefault: v.isDefault ?? vi === 0,
              displayOrder: v.displayOrder ?? vi,
              priceAdjustment: String(v.priceAdjustment ?? "0"),
            })),
        })),
    }),
}));

function extractS3Key(url: string): string {
  try {
    return new URL(url).pathname.slice(1);
  } catch {
    return url;
  }
}
