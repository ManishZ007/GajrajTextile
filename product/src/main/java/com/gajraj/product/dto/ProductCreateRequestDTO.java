package com.gajraj.product.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@ToString
public class ProductCreateRequestDTO {

    private String name;
    private UUID categoryId;
    private BigDecimal basePrice;
    private String description;
    private String status;
    private List<VariantRequest> variants;
    private List<AttributeRequest> attributes;
    private List<ImageRequest> images;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class VariantRequest {
        private String size;
        private String color;
        private BigDecimal price;
        private Integer stockQuantity;
        private String sku;
        private String status;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class AttributeRequest {
        private String attributeKey;
        private String attributeValue;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ImageRequest {
        private String imageUrl;
        private Boolean isPrimary;
        private Integer displayOrder;
    }

}
