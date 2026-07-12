package com.gajraj.shipping.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class NextStatusRequest {

    @NotBlank(message = "shipmentId is required")
    private String shipmentId;
}
