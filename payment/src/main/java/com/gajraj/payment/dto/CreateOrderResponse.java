package com.gajraj.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CreateOrderResponse {
    private String razorpayOrderId;
    private String keyId;
    private Long amount;
}
