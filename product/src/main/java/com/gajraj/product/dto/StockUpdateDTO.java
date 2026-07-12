package com.gajraj.product.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class StockUpdateDTO {
    private Integer newQuantity;
    private Integer adjustmentAmount;
    private String reason;
    private String changedBy;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class BulkStockUpdateItem {
        private UUID variantId;
        private Integer newQuantity;
        private String reason;
        private String changedBy;
    }
}
