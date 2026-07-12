package com.gajraj.shipping.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TrackingResponse {
    private ShipmentResponse shipment;
    private List<TrackingEventResponse> timeline;
    private String currentStatus;
    private LocalDateTime estimatedDelivery;
}
