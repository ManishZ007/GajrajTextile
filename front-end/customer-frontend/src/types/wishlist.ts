export interface WishlistItem {
  wishlistId: string;
  customerId: string;
  productId: string;
  productName: string;
  primaryImage: string;
  basePrice: number;
  categoryName: string;
  addedAt: string;
}

export interface WishlistCheckResponse {
  wishlisted: boolean;
  wishlistId: string | null;
}
