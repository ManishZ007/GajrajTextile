package com.gajraj.product.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class StockHistoryDTO {
    private UUID historyId;
    private UUID variantId;
    private String productName;
    private String sku;
    private String color;
    private String size;
    private String changeType;
    private Integer previousQuantity;
    private Integer newQuantity;
    private Integer changeAmount;
    private String reason;
    private String changedBy;
    private LocalDateTime createdAt;
}
