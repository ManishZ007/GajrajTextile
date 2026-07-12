package com.gajraj.shipping.provider.model;

import com.gajraj.shipping.enums.Provider;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ShipmentProviderResult {
    private String trackingNumber;
    private String awbNumber;
    private String courierName;
    private String trackingUrl;
    private LocalDateTime estimatedDelivery;
    private Provider provider;
}
