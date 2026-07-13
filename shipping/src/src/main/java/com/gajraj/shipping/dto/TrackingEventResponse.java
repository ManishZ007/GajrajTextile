package com.gajraj.shipping.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TrackingEventResponse {
    private UUID trackingId;
    private String status;
    private String title;
    private String description;
    private String location;
    private LocalDateTime eventTime;
}
