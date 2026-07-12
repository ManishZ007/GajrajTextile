package com.gajraj.product.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AddToCartRequestDTO {

    private UUID customerId;
    private UUID productId;
    private UUID variantId;
    private Integer quantity = 1;
    private String itemType;

    private CustomizationRequest customization;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CustomizationRequest {
        private UUID padarId;
        private UUID borderId;
        private UUID buttiId;
        private UUID bodyColorId;
        private UUID borderColorId;
        private String zari;
    }
}
