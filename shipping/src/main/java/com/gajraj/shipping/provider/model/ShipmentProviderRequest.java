package com.gajraj.shipping.provider.model;

import com.gajraj.shipping.enums.ShipmentType;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ShipmentProviderRequest {
    private String orderId;
    private String userId;
    private ShipmentType shipmentType;
    private String recipientName;
    private String recipientPhone;
    private String recipientAddress;
    private String recipientCity;
    private String recipientState;
    private String recipientPincode;
    private double weightKg;
}
