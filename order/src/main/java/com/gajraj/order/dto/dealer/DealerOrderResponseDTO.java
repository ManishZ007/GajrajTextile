package com.gajraj.order.dto.dealer;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DealerOrderResponseDTO {
    private UUID dealerOrderId;
    private String orderNumber;
    private DealerResponseDTO dealer;
    private String createdByManagerId;
    private String status;
    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private BigDecimal balanceAmount;
    private String notes;
    private List<DealerOrderItemDTO> items;
    private List<DealerPaymentDTO> payments;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
