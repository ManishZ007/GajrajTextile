package com.gajraj.manager.dto.orderFlowDTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrderFlowResponseDTO {
    private UUID id;
    private String orderId;
    private String productStatus;
    private String qualityCheck;
    private String shippingStatus;
    private String addressId;
    private String handledBy;
    private String note;
    private LocalDateTime updatedAt;
    private String currentStage;
}
