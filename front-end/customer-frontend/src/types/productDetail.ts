export interface ProductImage {
  imageId: string;
  viewUrl: string;
  s3Key: string;
  isPrimary: boolean;
  displayOrder: number;
}

export interface ProductVariant {
  variantId: string;
  size: string;
  color: string;
  price: number;
  stockQuantity: number;
  sku: string;
  status: string;
  stockLevel: string;
  createdAt: string;
}

export interface ProductAttribute {
  attributeId: string;
  key: string;
  value: string;
}

export interface ProductDetail {
  productId: string;
  name: string;
  description: string;
  basePrice: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  category: {
    categoryId: string;
    name: string;
    description: string;
  };
  images: ProductImage[];
  variants: ProductVariant[];
  attributes: ProductAttribute[];
  isCustomizable: boolean;
  defaultPadarId: string;
  defaultBorderId: string;
  defaultButtiId: string;
  defaultBodyColorId: string;
  defaultBorderColorId: string;
  defaultZari: string | null;
  totalVariants: number;
  totalStock: number;
  totalImages: number;
  totalAttributes: number;
  lowestPrice: number;
  highestPrice: number;
}
