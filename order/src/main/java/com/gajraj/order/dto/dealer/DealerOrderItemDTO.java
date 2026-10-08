package com.gajraj.order.dto.dealer;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DealerOrderItemDTO {
    private UUID itemId;
    private String category;
    private String color;
    private String buttiName;
    private String padarName;
    private String zariName;
    private Boolean gondas;
    private Integer quantity;
    private BigDecimal pricePerPiece;
    private BigDecimal totalPrice;
}
