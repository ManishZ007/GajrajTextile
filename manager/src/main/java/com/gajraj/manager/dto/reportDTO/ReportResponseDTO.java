package com.gajraj.manager.dto.reportDTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ReportResponseDTO {
    private UUID id;
    private String reportType;
    private String description;
    private String reportedBy;
    private Boolean isRead;
    private Boolean approve;
    private LocalDateTime updatedAt;
}
