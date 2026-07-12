export interface ProductResponse {
  productId: string;
  name: string;
  category: {
    categoryId: string;
    name: string;
  };
  basePrice: number;
  status: 'ACTIVE' | 'INACTIVE';
  variantCount: number;
  totalStock: number;
  primaryImage: string;
  description: string | null;
  createdAt: string;
  customizable: boolean | null;
  customOptions: unknown | null;
}
