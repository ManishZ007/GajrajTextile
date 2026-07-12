package com.gajraj.product.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class InventoryAuditLogDTO {
    private UUID logId;
    private String changeType;
    private Integer quantityChanged;
    private Integer quantityBefore;
    private Integer quantityAfter;
    private String reason;
    private LocalDateTime changedAt;
}
