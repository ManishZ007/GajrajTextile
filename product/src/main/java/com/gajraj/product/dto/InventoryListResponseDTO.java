package com.gajraj.product.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class InventoryListResponseDTO {
    private List<InventoryItemDTO> content;
    private long totalElements;
    private int totalPages;
    private int currentPage;
    private int pageSize;

    private long totalVariants;
    private long inStockCount;
    private long lowStockCount;
    private long outOfStockCount;
    private long totalStockUnits;
}
