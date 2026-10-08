package com.gajraj.order.dto.dealer;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DealerPaymentDTO {
    private UUID paymentId;
    private BigDecimal amount;
    private String paymentMode;
    private String referenceNumber;
    private String note;
    private String recordedByManagerId;
    private LocalDateTime paidAt;
}
