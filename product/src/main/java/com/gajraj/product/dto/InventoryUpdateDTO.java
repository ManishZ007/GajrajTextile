package com.gajraj.product.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class InventoryUpdateDTO {
    private String operation;      // ADD, DEDUCT, SET
    private Integer quantity;
    private String reason;
    private Integer lowStockThreshold; // optional — update threshold at the same time
}
