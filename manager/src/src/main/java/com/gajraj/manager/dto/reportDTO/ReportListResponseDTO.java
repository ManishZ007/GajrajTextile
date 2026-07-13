package com.gajraj.manager.dto.reportDTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ReportListResponseDTO {
    private List<ReportResponseDTO> content;
    private long totalElements;
    private int totalPages;
    private int currentPage;
    private int pageSize;

    private long totalReports;
    private long unreadCount;
    private long approvedCount;
    private long pendingCount;
    private long workerPerformanceCount;
    private long inventoryUpdateCount;
    private long customerIssueCount;
}
