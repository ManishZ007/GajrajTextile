package com.gajraj.order.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateOrderRequestDTO {

    private String userId;
    private String addressId;
    private String paymentMethod;
    private BigDecimal totalAmount;
    private List<OrderItemRequestDTO> items;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class OrderItemRequestDTO {
        private String productId;
        private String variantId;
        private int quantity;
        private BigDecimal subtotal;
        private String orderType;
    }
}
