package com.gajraj.owner.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OwnerDashboardDTO {
    private long totalReports;
    private long unreadReports;
    private long pendingApprovals;
    private long pendingPriceChanges;
    private long approvedReports;
    private long rejectedReports;
}
