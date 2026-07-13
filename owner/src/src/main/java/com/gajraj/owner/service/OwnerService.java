package com.gajraj.owner.service;

import com.gajraj.owner.dto.OwnerDashboardDTO;
import com.gajraj.owner.feign.ManagerReportsClient;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Service
public class OwnerService {

    private final ManagerReportsClient managerClient;

    public OwnerService(ManagerReportsClient managerClient) {
        this.managerClient = managerClient;
    }

    // ── Reports ──────────────────────────────────────────────

    public ResponseEntity<?> getAllReports(int page, int size, String reportType, String readStatus, String approvalStatus) {
        return managerClient.getAllReports(page, size, reportType, readStatus, approvalStatus);
    }

    public ResponseEntity<?> getReportById(UUID reportId) {
        managerClient.markAsRead(reportId);
        return managerClient.getReportById(reportId);
    }

    public ResponseEntity<?> approveReport(UUID reportId) {
        return managerClient.approveReport(reportId, true);
    }

    public ResponseEntity<?> rejectReport(UUID reportId) {
        return managerClient.approveReport(reportId, false);
    }

    // ── Price Changes ────────────────────────────────────────

    public ResponseEntity<?> getAllPriceChanges(int page, int size, String approvalStatus, String productId) {
        return managerClient.getAllPriceChanges(page, size, approvalStatus, productId);
    }

    public ResponseEntity<?> approvePriceChange(UUID priceChangeId) {
        return managerClient.approvePriceChange(priceChangeId, true);
    }

    public ResponseEntity<?> rejectPriceChange(UUID priceChangeId) {
        return managerClient.approvePriceChange(priceChangeId, false);
    }

    // ── Dashboard ────────────────────────────────────────────

    public OwnerDashboardDTO getDashboard() {
        OwnerDashboardDTO dashboard = new OwnerDashboardDTO();

        try {
            ResponseEntity<?> reportsRes = managerClient.getAllReports(0, 1, null, null, null);
            if (reportsRes.getBody() instanceof Map<?, ?> body) {
                dashboard.setTotalReports(toLong(body.get("totalReports")));
                dashboard.setUnreadReports(toLong(body.get("unreadCount")));
                dashboard.setApprovedReports(toLong(body.get("approvedCount")));
                dashboard.setPendingApprovals(toLong(body.get("pendingCount")));
            }

            ResponseEntity<?> priceRes = managerClient.getAllPriceChanges(0, 1, null, null);
            if (priceRes.getBody() instanceof Map<?, ?> body) {
                dashboard.setPendingPriceChanges(toLong(body.get("pendingCount")));
            }
        } catch (Exception e) {
            // Manager Service unavailable — return zeros
        }

        return dashboard;
    }

    private long toLong(Object obj) {
        if (obj instanceof Number n) return n.longValue();
        return 0;
    }

}
