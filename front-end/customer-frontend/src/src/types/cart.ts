export interface CartProduct {
  productId: string;
  name: string;
  description: string;
  basePrice: number;
  status: string;
  categoryId: string;
  categoryName: string;
}

export interface CartVariant {
  variantId: string;
  size: string;
  color: string;
  sku: string;
  price: number;
  stockQuantity: number;
  status: string;
}

export interface CartCustomization {
  padarId?: string;
  borderId?: string;
  buttiId?: string;
  bodyColorId?: string;
  borderColorId?: string;
  zari?: string;
}

export interface CartItem {
  cartItemId: string;
  itemType: 'READY_MADE' | 'CUSTOMIZED';
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product: CartProduct;
  variant: CartVariant | null;
  customization: CartCustomization | null;
  primaryImageUrl: string;
  inStock: boolean;
  availableStock: number;
  addedAt: string;
}

export interface CartResponse {
  cartId: string;
  customerId: string;
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  estimatedTotal: number;
  updatedAt: string;
}

export interface CartSummary {
  cartId: string;
  customerId: string;
  totalItems: number;
  uniqueProducts: number;
  subtotal: number;
  estimatedTotal: number;
}

export interface AddToCartPayload {
  productId: string;
  variantId?: string | null;
  quantity: number;
  itemType: 'READY_MADE' | 'CUSTOMIZED';
  customization?: CartCustomization;
}
