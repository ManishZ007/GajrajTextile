package com.gajraj.shipping.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CancelShipmentRequest {

    @NotBlank(message = "shipmentId is required")
    private String shipmentId;

    private String reason;
}
