package com.gajraj.product.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CartResponseDTO {

    private UUID cartId;
    private UUID customerId;
    private List<CartItemDTO> items;
    private int totalItems;
    private BigDecimal subtotal;
    private BigDecimal estimatedTotal;
    private LocalDateTime updatedAt;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CartItemDTO {
        private UUID cartItemId;
        private String itemType;
        private int quantity;
        private BigDecimal unitPrice;
        private BigDecimal subtotal;
        private ProductInfo product;
        private VariantInfo variant;
        private CustomizationInfo customization;
        private String primaryImageUrl;
        private boolean inStock;
        private Integer availableStock;
        private LocalDateTime addedAt;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ProductInfo {
        private UUID productId;
        private String name;
        private String description;
        private BigDecimal basePrice;
        private String status;
        private UUID categoryId;
        private String categoryName;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class VariantInfo {
        private UUID variantId;
        private String size;
        private String color;
        private String sku;
        private BigDecimal price;
        private Integer stockQuantity;
        private String status;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CustomizationInfo {
        private UUID padarId;
        private String padarName;
        private String padarModelUrl;

        private UUID borderId;
        private String borderName;
        private String borderModelUrl;

        private UUID buttiId;
        private String buttiName;
        private String buttiModelUrl;

        private UUID bodyColorId;
        private String bodyColorName;
        private String bodyColorHexCode;

        private UUID borderColorId;
        private String borderColorName;
        private String borderColorHexCode;

        private String zari;
    }
}
