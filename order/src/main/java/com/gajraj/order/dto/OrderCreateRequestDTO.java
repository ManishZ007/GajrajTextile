package com.gajraj.order.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrderCreateRequestDTO {

    private String userId;
    private String productId;
    private String variantId;
    private String addressId;
    private String orderType;
    private int quantity;
    private BigDecimal totalAmount;
    private String paymentMethod;
    private CustomizationDTO customization;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CustomizationDTO {
        private String padar;
        private String butti;
        private String kinar;
        private String zari;
        private String gond;
        private String baseColor;
        private String previewImageUrl;
    }
}
