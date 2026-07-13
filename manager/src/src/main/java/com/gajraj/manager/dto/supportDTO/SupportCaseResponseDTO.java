package com.gajraj.manager.dto.supportDTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SupportCaseResponseDTO {
    private UUID id;
    private String orderId;
    private String customerId;
    private String issueType;
    private String description;
    private String status;
    private String handledBy;
    private String resolutionNote;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
