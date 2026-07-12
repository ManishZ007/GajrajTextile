package com.gajraj.payment.dto;

import lombok.Data;

@Data
public class CreateOrderRequest {
    private String orderId;
    private Long amount;
    private String paymentMethod; // "COD", "UPI", "CARD", "NET_BANKING", "RAZORPAY"
}
