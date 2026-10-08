package com.gajraj.order.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrderResponseDTO {

    private UUID orderId;
    private String orderNumber;
    private String userId;
    private String addressId;
    private String orderStatus;
    private String paymentMethod;
    private Boolean codCollected;
    private Boolean integrationPending;
    private Boolean shipmentStarted;
    private String readyMadeQuality;
    private String holdReason;
    private BigDecimal totalAmount;

    private String handledByManagerId;
    private LocalDateTime orderDate;
    private LocalDateTime updatedAt;
    private List<OrderItemDTO> items;
    private CustomizationDTO customization;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class OrderItemDTO {
        private UUID orderItemId;
        private String productId;
        private String variantId;
        private int quantity;
        private BigDecimal subtotal;
        private String orderType;
        private String currentStatus;
        private String trackingNumber;
        private String courierService;
        private String estimatedDelivery;
    }

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
