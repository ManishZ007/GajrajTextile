package com.gajraj.product.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class VariantResponseDTO {

    private UUID variantId;
    private String productName;
    private UUID productId;
    private String categoryName;
    private String size;
    private String color;
    private BigDecimal price;
    private int stockQuantity;
    private String sku;
    private String status;
    private LocalDateTime createdAt;
}
