package com.gajraj.order.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrderResponseDTO {

    private UUID orderId;
    private String orderNumber;
    private String userId;
    private String productId;
    private String variantId;
    private String addressId;
    private String orderType;
    private String orderStatus;
    private String paymentMethod;
    private BigDecimal totalAmount;
    private CustomizationDTO customization;
    private LocalDateTime orderDate;
    private LocalDateTime updatedAt;

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
