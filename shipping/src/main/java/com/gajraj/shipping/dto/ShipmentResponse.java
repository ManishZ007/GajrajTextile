package com.gajraj.shipping.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ShipmentResponse {
    private UUID shipmentId;
    private String orderId;
    private String userId;
    private String provider;
    private String shipmentType;
    private String trackingNumber;
    private String awbNumber;
    private String courierName;
    private String trackingUrl;
    private LocalDateTime estimatedDelivery;
    private String shipmentStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
