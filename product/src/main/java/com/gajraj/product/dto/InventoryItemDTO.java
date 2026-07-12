package com.gajraj.product.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class InventoryItemDTO {
    private UUID variantId;
    private UUID productId;
    private String productName;
    private String categoryName;
    private String primaryImage;
    private String size;
    private String color;
    private BigDecimal price;
    private Integer stockQuantity;
    private String sku;
    private String status;
    private String stockLevel;  // GOOD, LOW, OUT_OF_STOCK
}
