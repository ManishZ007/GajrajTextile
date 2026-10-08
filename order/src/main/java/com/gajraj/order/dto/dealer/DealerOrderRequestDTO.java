package com.gajraj.order.dto.dealer;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DealerOrderRequestDTO {
    private UUID dealerId;
    private String notes;
    private List<ItemRequest> items;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ItemRequest {
        private String category;
        private String color;
        private String buttiName;
        private String padarName;
        private String zariName;
        private Boolean gondas;
        private Integer quantity;
        private BigDecimal pricePerPiece;
    }
}
