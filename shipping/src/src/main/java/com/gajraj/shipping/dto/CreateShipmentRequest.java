package com.gajraj.shipping.dto;

import com.gajraj.shipping.enums.ShipmentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class CreateShipmentRequest {

    @NotBlank(message = "orderId is required")
    private String orderId;

    @NotNull(message = "shipmentType is required")
    private ShipmentType shipmentType;

    @NotBlank(message = "recipientName is required")
    private String recipientName;

    @NotBlank(message = "recipientPhone is required")
    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Invalid Indian phone number")
    private String recipientPhone;

    @NotBlank(message = "recipientAddress is required")
    private String recipientAddress;

    @NotBlank(message = "recipientCity is required")
    private String recipientCity;

    @NotBlank(message = "recipientState is required")
    private String recipientState;

    @NotBlank(message = "recipientPincode is required")
    @Pattern(regexp = "^[1-9][0-9]{5}$", message = "Invalid Indian pincode")
    private String recipientPincode;

    private double weightKg = 0.5;
}
