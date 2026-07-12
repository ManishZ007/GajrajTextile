package com.gajraj.product.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class InventoryResponseDTO {
    private UUID inventoryId;
    private UUID productId;
    private String productName;
    private String categoryName;
    private Integer quantity;
    private Integer lowStockThreshold;
    private Boolean isLowStock;
    private LocalDateTime lastUpdated;
}
