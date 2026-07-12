package com.gajraj.manager.dto.reportDTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ReportCreateDTO {
    private String reportType;
    private String description;
    private String reportedBy;
}
