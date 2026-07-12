package com.gajraj.product.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@ToString
public class ProductListResponseDTO {

    private List<ProductSummary> content;
    private long totalElements;
    private int totalPages;
    private int currentPage;
    private int pageSize;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ProductSummary {
        private UUID productId;
        private String name;
        private String description;
        private CategorySummary category;
        private BigDecimal basePrice;
        private String status;
        private int variantCount;
        private int totalStock;
        private String primaryImage;
        private LocalDateTime createdAt;
        private Boolean customizable;
        private CustomOptions customOptions;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CategorySummary {
        private UUID categoryId;
        private String name;
        private String baseImageUrl;
        private String baseTitle;
        private String baseShortDescription;
        private String baseDescription;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CustomOptions {
        private List<CustomOptionItem> padars;
        private List<CustomOptionItem> borders;
        private List<CustomOptionItem> buttis;
        private List<ColorOptionItem> bodyColors;
        private List<ColorOptionItem> borderColors;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CustomOptionItem {
        private UUID id;
        private String name;
        private String modelUrl;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ColorOptionItem {
        private UUID id;
        private String name;
        private String hexCode;
    }
}
