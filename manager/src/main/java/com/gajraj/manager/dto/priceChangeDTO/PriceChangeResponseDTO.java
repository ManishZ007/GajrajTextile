package com.gajraj.manager.dto.priceChangeDTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PriceChangeResponseDTO {
    private UUID id;
    private String productId;
    private String productName;
    private BigDecimal oldPrice;
    private BigDecimal newPrice;
    private BigDecimal priceDifference;
    private String percentageChange;
    private String updatedBy;
    private String reason;
    private Boolean ownerApproval;
    private String approvalStatus;
    private UUID ownerReportId;
    private LocalDateTime updatedAt;
}
