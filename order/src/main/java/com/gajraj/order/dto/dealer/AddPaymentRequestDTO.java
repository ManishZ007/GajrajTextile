package com.gajraj.order.dto.dealer;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AddPaymentRequestDTO {
    private BigDecimal amount;
    private String paymentMode;
    private String referenceNumber;
    private String note;
}
