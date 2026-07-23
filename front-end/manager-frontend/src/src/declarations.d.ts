export interface Product {
  productId: string;
  name: string;
  category: { categoryId: string; name: string };
  basePrice: number;
  status: "ACTIVE" | "OUT_OF_STOCK";
  variantCount: number;
  totalStock: number;
  primaryImage: string | null;
  createdAt: string;
}
