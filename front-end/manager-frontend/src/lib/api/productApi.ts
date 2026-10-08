import { apiFetch } from "./apiFetch";

const PRODUCT_SERVICE = "http://localhost:8087";

// Categories
export async function fetchCategories() {
  return apiFetch(`${PRODUCT_SERVICE}/product/categories`);
}

// Pre-signed upload URLs
export async function getUploadUrls(category: string, fileNames: string[]) {
  const params = new URLSearchParams({
    category,
    fileNames: fileNames.join(","),
  });
  return apiFetch(`${PRODUCT_SERVICE}/product/upload-urls?${params}`);
}

// Upload image directly to S3
export async function uploadToS3(uploadUrl: string, file: File) {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });
  if (!res.ok) throw new Error("S3 upload failed");
}

// Create product with all related data
export async function createProduct(data: {
  name: string;
  categoryId: string;
  basePrice: number;
  description: string;
  status: string;
  variants: {
    size: string;
    color: string;
    price: number;
    stockQuantity: number;
    sku: string;
    status: string;
  }[];
  attributes: { attributeKey: string; attributeValue: string }[];
  images: { imageUrl: string; isPrimary: boolean; displayOrder: number }[];
}) {
  return apiFetch(`${PRODUCT_SERVICE}/product/create`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function fetchAllProduct() {
  return apiFetch(`${PRODUCT_SERVICE}/product/all`);
}

export async function fetchProductById(productId: string) {
  return apiFetch(`${PRODUCT_SERVICE}/product/${productId}`);
}

export async function updateProduct(productId: string, data: unknown) {
  return apiFetch(`${PRODUCT_SERVICE}/product/update/${productId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function createCategory(data: { name: string; description: string }) {
  return apiFetch(`${PRODUCT_SERVICE}/product/categories/create`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCategory(
  categoryId: string,
  data: { name: string; description: string; baseModelUrl?: string },
) {
  return apiFetch(`${PRODUCT_SERVICE}/product/categories/update/${categoryId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteCategoryBaseModel(categoryId: string) {
  return apiFetch(`${PRODUCT_SERVICE}/product/categories/${categoryId}/base-model-url`, {
    method: "DELETE",
  });
}

export async function deleteCategory(categoryId: string) {
  return apiFetch(`${PRODUCT_SERVICE}/product/categories/delete/${categoryId}`, {
    method: "DELETE",
  });
}

export async function fetchAllVariants(
  params: {
    page?: number;
    size?: number;
    search?: string;
    status?: string;
    productId?: string;
  } = {},
) {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.size !== undefined) query.set("size", String(params.size));
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);
  if (params.productId) query.set("productId", params.productId);
  return apiFetch(`${PRODUCT_SERVICE}/product/variants/all?${query}`);
}

export async function updateVariant(
  variantId: string,
  data: {
    price?: number;
    stockQuantity?: number;
    status?: string;
    size?: string;
    color?: string;
    sku?: string;
  },
) {
  return apiFetch(`${PRODUCT_SERVICE}/product/variants/update/${variantId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteVariant(variantId: string) {
  return apiFetch(`${PRODUCT_SERVICE}/product/variants/delete/${variantId}`, {
    method: "DELETE",
  });
}

export async function fetchAllImages(
  params: {
    page?: number;
    size?: number;
    productId?: string;
    primaryOnly?: boolean;
  } = {},
) {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.size !== undefined) query.set("size", String(params.size));
  if (params.productId) query.set("productId", params.productId);
  if (params.primaryOnly) query.set("primaryOnly", "true");
  return apiFetch(`${PRODUCT_SERVICE}/product/images/all?${query}`);
}

export async function setImageAsPrimary(imageId: string) {
  return apiFetch(`${PRODUCT_SERVICE}/product/images/set-primary/${imageId}`, {
    method: "PUT",
  });
}

export async function deleteImage(imageId: string) {
  return apiFetch(`${PRODUCT_SERVICE}/product/images/delete/${imageId}`, {
    method: "DELETE",
  });
}

export async function fetchArchivedProducts(
  params: { page?: number; size?: number } = {},
) {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.size !== undefined) query.set("size", String(params.size));
  query.set("status", "ARCHIVED");
  return apiFetch(`${PRODUCT_SERVICE}/product/all?${query}`);
}

export async function archiveProduct(productId: string) {
  return apiFetch(`${PRODUCT_SERVICE}/product/archive/${productId}`, {
    method: "PUT",
  });
}

export async function unarchiveProduct(productId: string) {
  return apiFetch(`${PRODUCT_SERVICE}/product/unarchive/${productId}`, {
    method: "PUT",
  });
}

export async function getConfigUploadUrl(fileName: string, assetType: string) {
  return apiFetch(
    `${PRODUCT_SERVICE}/product/config/upload-url?fileName=${encodeURIComponent(fileName)}&assetType=${assetType}`,
  );
}

export async function getProductConfig(productId: string) {
  return apiFetch(`${PRODUCT_SERVICE}/product/${productId}/config`);
}

// ── Config Assets ──────────────────────────────────────────────────────────────

export async function fetchAllAssets(
  params: {
    page?: number;
    size?: number;
    assetType?: string;
    category?: string;
    search?: string;
  } = {},
) {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.size !== undefined) query.set("size", String(params.size));
  if (params.assetType) query.set("assetType", params.assetType);
  if (params.category) query.set("category", params.category);
  if (params.search) query.set("search", params.search);
  return apiFetch(`${PRODUCT_SERVICE}/product/assets/all?${query}`);
}

export async function createAsset(data: {
  name: string;
  assetType: string;
  category: string;
  s3Key: string;
  fileExtension?: string;
  fileSizeBytes?: number;
  description?: string;
}) {
  return apiFetch(`${PRODUCT_SERVICE}/product/assets/create`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAsset(
  assetId: string,
  data: {
    name: string;
    assetType: string;
    category: string;
    s3Key: string;
    fileExtension?: string;
    description?: string;
  },
) {
  return apiFetch(`${PRODUCT_SERVICE}/product/assets/update/${assetId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteAsset(assetId: string) {
  return apiFetch(`${PRODUCT_SERVICE}/product/assets/delete/${assetId}`, {
    method: "DELETE",
  });
}

export async function getAssetUploadUrl(
  fileName: string,
  assetType: string,
  category: string,
) {
  return apiFetch(
    `${PRODUCT_SERVICE}/product/assets/upload-url?fileName=${encodeURIComponent(fileName)}&assetType=${assetType}&category=${category}`,
  );
}

export async function fetchAssetsByCategory(category: string) {
  return apiFetch(`${PRODUCT_SERVICE}/product/assets/by-category/${category}`);
}

export async function fetchProductDetail(productId: string) {
  return apiFetch(`${PRODUCT_SERVICE}/product/detail/${productId}`);
}

// ── Inventory ──────────────────────────────────────────────────────────────────

export async function fetchInventory(
  params: {
    page?: number;
    size?: number;
    stockLevel?: string;
    search?: string;
    categoryId?: string;
    sortBy?: string;
  } = {},
) {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.size !== undefined) query.set("size", String(params.size));
  if (params.stockLevel) query.set("stockLevel", params.stockLevel);
  if (params.search) query.set("search", params.search);
  if (params.categoryId) query.set("categoryId", params.categoryId);
  if (params.sortBy) query.set("sortBy", params.sortBy);
  return apiFetch(`${PRODUCT_SERVICE}/product/inventory/all?${query}`);
}

export async function fetchLowStock(
  params: { page?: number; size?: number; threshold?: number } = {},
) {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.size !== undefined) query.set("size", String(params.size));
  if (params.threshold !== undefined) query.set("threshold", String(params.threshold));
  return apiFetch(`${PRODUCT_SERVICE}/product/inventory/low-stock?${query}`);
}

export async function updateStock(
  variantId: string,
  data: {
    newQuantity?: number;
    adjustmentAmount?: number;
    reason: string;
    expectedQuantity?: number;
    changedBy?: string;
  },
) {
  return apiFetch(`${PRODUCT_SERVICE}/product/inventory/update/${variantId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function bulkUpdateStock(
  items: { variantId: string; newQuantity: number; reason: string; expectedQuantity: number }[],
) {
  return apiFetch(`${PRODUCT_SERVICE}/product/inventory/bulk-update`, {
    method: "PUT",
    body: JSON.stringify(items),
  });
}

export async function getCategoryBaseImageUploadUrl(categoryId: string, fileName: string) {
  return apiFetch(
    `${PRODUCT_SERVICE}/product/categories/${categoryId}/base-image/upload-url?fileName=${encodeURIComponent(fileName)}`,
  );
}

export async function saveCategoryBaseImage(categoryId: string, s3Key: string) {
  return apiFetch(`${PRODUCT_SERVICE}/product/categories/${categoryId}/base-image`, {
    method: "PATCH",
    body: JSON.stringify({ s3Key }),
  });
}

export async function removeCategoryBaseImage(categoryId: string) {
  return apiFetch(`${PRODUCT_SERVICE}/product/categories/${categoryId}/base-image`, {
    method: "DELETE",
  });
}

export async function saveCategoryBaseContent(
  categoryId: string,
  data: { baseTitle?: string; baseShortDescription?: string; baseDescription?: string },
) {
  return apiFetch(`${PRODUCT_SERVICE}/product/categories/${categoryId}/base-content`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function getCategoryAssetUploadUrl(fileName: string, categoryName: string, subFolder?: string) {
  const params = new URLSearchParams({ fileName, assetType: "MODEL", category: categoryName });
  if (subFolder) params.set("subFolder", subFolder);
  return apiFetch(`${PRODUCT_SERVICE}/product/assets/upload-url?${params}`);
}

export async function getCategoryTextureUploadUrl(fileName: string, categoryName: string, subFolder?: string) {
  const params = new URLSearchParams({ fileName, assetType: "TEXTURE", category: categoryName });
  if (subFolder) params.set("subFolder", subFolder);
  return apiFetch(`${PRODUCT_SERVICE}/product/assets/upload-url?${params}`);
}

// ── Category-level customization ──────────────────────────────────────────────

export async function fetchCategoryById(categoryId: string) {
  return apiFetch(`${PRODUCT_SERVICE}/product/categories/${categoryId}`);
}

export async function fetchPadarsByCategory(categoryId: string) {
  const data = await apiFetch(`${PRODUCT_SERVICE}/padars/category/${categoryId}`);
  return (Array.isArray(data) ? data : []).map((p: Record<string, string>) => ({
    id: p.padarId ?? p.id,
    name: p.padarName ?? p.name,
    modelUrl: p.padarUrl ?? p.modelUrl,
  }));
}

export async function fetchBordersByCategory(categoryId: string) {
  const data = await apiFetch(`${PRODUCT_SERVICE}/borders/category/${categoryId}`);
  return (Array.isArray(data) ? data : []).map((b: Record<string, string>) => ({
    id: b.borderId ?? b.id,
    name: b.borderName ?? b.name,
    modelUrl: b.borderUrl ?? b.modelUrl,
  }));
}

export async function fetchButtiesByCategory(categoryId: string) {
  const data = await apiFetch(`${PRODUCT_SERVICE}/buttis/category/${categoryId}`);
  return (Array.isArray(data) ? data : []).map((b: Record<string, string>) => ({
    id: b.buttiId ?? b.id,
    name: b.buttiName ?? b.name,
    modelUrl: b.buttiUrl ?? b.modelUrl,
  }));
}

export async function fetchBodyColorsByCategory(categoryId: string) {
  return apiFetch(`${PRODUCT_SERVICE}/body-colors/category/${categoryId}`);
}

export async function fetchBorderColorsByCategory(categoryId: string) {
  return apiFetch(`${PRODUCT_SERVICE}/border-colors/category/${categoryId}`);
}

// CRUD for padars
export async function fetchAllPadars() {
  return apiFetch(`${PRODUCT_SERVICE}/padars/all`);
}
export async function createPadar(data: { name: string; modelUrl: string; categoryId: string }) {
  return apiFetch(`${PRODUCT_SERVICE}/padars/create`, { method: "POST", body: JSON.stringify({ name: data.name, modelUrl: data.modelUrl, categoryId: data.categoryId }) });
}
export async function updatePadar(id: string, data: { name: string; modelUrl: string }) {
  return apiFetch(`${PRODUCT_SERVICE}/padars/update/${id}`, { method: "PUT", body: JSON.stringify({ name: data.name, modelUrl: data.modelUrl }) });
}
export async function deletePadar(id: string) {
  return apiFetch(`${PRODUCT_SERVICE}/padars/delete/${id}`, { method: "DELETE" });
}

// CRUD for borders
export async function fetchAllBorders() {
  return apiFetch(`${PRODUCT_SERVICE}/borders/all`);
}
export async function createBorder(data: { name: string; modelUrl: string; categoryId: string }) {
  return apiFetch(`${PRODUCT_SERVICE}/borders/create`, { method: "POST", body: JSON.stringify({ name: data.name, modelUrl: data.modelUrl, categoryId: data.categoryId }) });
}
export async function updateBorder(id: string, data: { name: string; modelUrl: string }) {
  return apiFetch(`${PRODUCT_SERVICE}/borders/update/${id}`, { method: "PUT", body: JSON.stringify({ name: data.name, modelUrl: data.modelUrl }) });
}
export async function deleteBorder(id: string) {
  return apiFetch(`${PRODUCT_SERVICE}/borders/delete/${id}`, { method: "DELETE" });
}

// CRUD for buttis
export async function fetchAllButtis() {
  return apiFetch(`${PRODUCT_SERVICE}/buttis/all`);
}
export async function createButti(data: { name: string; modelUrl: string; categoryId: string }) {
  return apiFetch(`${PRODUCT_SERVICE}/buttis/create`, { method: "POST", body: JSON.stringify({ name: data.name, modelUrl: data.modelUrl, categoryId: data.categoryId }) });
}
export async function updateButti(id: string, data: { name: string; modelUrl: string }) {
  return apiFetch(`${PRODUCT_SERVICE}/buttis/update/${id}`, { method: "PUT", body: JSON.stringify({ name: data.name, modelUrl: data.modelUrl }) });
}
export async function deleteButti(id: string) {
  return apiFetch(`${PRODUCT_SERVICE}/buttis/delete/${id}`, { method: "DELETE" });
}

// CRUD for body colors
export async function fetchAllBodyColors() {
  return apiFetch(`${PRODUCT_SERVICE}/body-colors`);
}
export async function createBodyColor(data: { name: string; hexCode: string; categoryId: string }) {
  return apiFetch(`${PRODUCT_SERVICE}/body-colors`, { method: "POST", body: JSON.stringify(data) });
}
export async function updateBodyColor(id: string, data: { name: string; hexCode: string }) {
  return apiFetch(`${PRODUCT_SERVICE}/body-colors/${id}`, { method: "PUT", body: JSON.stringify(data) });
}
export async function deleteBodyColor(id: string) {
  return apiFetch(`${PRODUCT_SERVICE}/body-colors/${id}`, { method: "DELETE" });
}

// CRUD for border colors
export async function fetchAllBorderColors() {
  return apiFetch(`${PRODUCT_SERVICE}/border-colors`);
}
export async function createBorderColor(data: { name: string; hexCode: string; categoryId: string }) {
  return apiFetch(`${PRODUCT_SERVICE}/border-colors`, { method: "POST", body: JSON.stringify(data) });
}
export async function updateBorderColor(id: string, data: { name: string; hexCode: string }) {
  return apiFetch(`${PRODUCT_SERVICE}/border-colors/${id}`, { method: "PUT", body: JSON.stringify(data) });
}
export async function deleteBorderColor(id: string) {
  return apiFetch(`${PRODUCT_SERVICE}/border-colors/${id}`, { method: "DELETE" });
}

export async function fetchStockHistory(
  params: {
    page?: number;
    size?: number;
    variantId?: string;
    changeType?: string;
  } = {},
) {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.size !== undefined) query.set("size", String(params.size));
  if (params.variantId) query.set("variantId", params.variantId);
  if (params.changeType) query.set("changeType", params.changeType);
  const data = await apiFetch(`${PRODUCT_SERVICE}/product/inventory/history?${query}`);
  const staff: { id: string; name: string }[] = await apiFetch("http://localhost:8081/auth/admin/report-staff").catch(() => []);
  const names = new Map(staff.map(person => [person.id, person.name]));
  return { ...data, content: data.content.map((entry: { changedBy?: string }) => ({
    ...entry,
    changedBy: entry.changedBy === "SYSTEM" ? "System" : names.get(entry.changedBy ?? "") ??
      (entry.changedBy === "MANAGER" ? "Manager (older record)" : "Staff name unavailable"),
  })) };

}

// Bulk tools must not silently omit variants after their first page.
export async function fetchCompleteInventory(threshold?: number) {
  const content = [];
  let page = 0;
  while (true) {
    const data = threshold === undefined ? await fetchInventory({ page, size: 200 })
      : await fetchLowStock({ page, size: 200, threshold });
    content.push(...data.content);
    if (++page >= data.totalPages) return { ...data, content };
  }
}
