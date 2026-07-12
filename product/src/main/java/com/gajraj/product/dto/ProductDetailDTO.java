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
public class ProductDetailDTO {

    private UUID productId;
    private String name;
    private String description;
    private BigDecimal basePrice;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private CategoryInfo category;
    private List<ImageInfo> images;
    private List<VariantInfo> variants;
    private List<AttributeInfo> attributes;

    private Boolean isCustomizable;
    private UUID defaultPadarId;
    private UUID defaultBorderId;
    private UUID defaultButtiId;
    private UUID defaultBodyColorId;
    private UUID defaultBorderColorId;
    private String defaultZari;

    private int totalVariants;
    private int totalStock;
    private int totalImages;
    private int totalAttributes;
    private BigDecimal lowestPrice;
    private BigDecimal highestPrice;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CategoryInfo {
        private UUID categoryId;
        private String name;
        private String description;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ImageInfo {
        private UUID imageId;
        private String viewUrl;
        private String s3Key;
        private boolean isPrimary;
        private int displayOrder;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class VariantInfo {
        private UUID variantId;
        private String size;
        private String color;
        private BigDecimal price;
        private int stockQuantity;
        private String sku;
        private String status;
        private String stockLevel;
        private LocalDateTime createdAt;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class AttributeInfo {
        private UUID attributeId;
        private String key;
        private String value;
    }
}
