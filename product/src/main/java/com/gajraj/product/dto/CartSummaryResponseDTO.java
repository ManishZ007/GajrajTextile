package com.gajraj.product.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CartSummaryResponseDTO {
    private UUID cartId;
    private UUID customerId;
    private int totalItems;
    private int uniqueProducts;
    private BigDecimal subtotal;
    private BigDecimal estimatedTotal;
}
