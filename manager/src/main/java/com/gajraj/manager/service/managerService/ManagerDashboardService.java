package com.gajraj.manager.service.managerService;

import com.gajraj.manager.feign.OrderServiceClient;
import com.gajraj.manager.model.CustomerSupportCase;
import com.gajraj.manager.model.ManagerOrderFlow;
import com.gajraj.manager.repo.CustomerSupportCaseRepo;
import com.gajraj.manager.repo.ManagerOrderFlowRepo;
import com.gajraj.manager.repo.OwnerReportsRepo;
import com.gajraj.manager.repo.ProductPriceUpdatedRepo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
public class ManagerDashboardService {

    private static final Logger log = LoggerFactory.getLogger(ManagerDashboardService.class);

    private final OrderServiceClient orderServiceClient;
    private final ManagerOrderFlowRepo managerOrderFlowRepo;
    private final CustomerSupportCaseRepo customerSupportCaseRepo;
    private final OwnerReportsRepo ownerReportsRepo;
    private final ProductPriceUpdatedRepo productPriceUpdatedRepo;

    public ManagerDashboardService(OrderServiceClient orderServiceClient,
                                   ManagerOrderFlowRepo managerOrderFlowRepo,
                                   CustomerSupportCaseRepo customerSupportCaseRepo,
                                   OwnerReportsRepo ownerReportsRepo,
                                   ProductPriceUpdatedRepo productPriceUpdatedRepo) {
        this.orderServiceClient = orderServiceClient;
        this.managerOrderFlowRepo = managerOrderFlowRepo;
        this.customerSupportCaseRepo = customerSupportCaseRepo;
        this.ownerReportsRepo = ownerReportsRepo;
        this.productPriceUpdatedRepo = productPriceUpdatedRepo;
    }

    @Transactional(readOnly = true)
    public ResponseEntity<?> getDashboardStats(String managerId, String authorization) {
        try {
            Map<String, Object> dashboard = new HashMap<>();
            dashboard.put("managerId", managerId);

            // ── Order Service stats (dealer + customer orders) ──────────────
            Map<String, Object> orderStats = new HashMap<>();
            try {
                ResponseEntity<Map<String, Object>> orderResponse = orderServiceClient.getManagerStats(managerId, authorization);
                if (orderResponse.getBody() != null) {
                    Map<String, Object> body = orderResponse.getBody();
                    orderStats.put("totalDealerOrders",   body.getOrDefault("totalDealerOrders",   0));
                    orderStats.put("totalCustomerOrders", body.getOrDefault("totalCustomerOrders", 0));
                    orderStats.put("totalDealers",        body.getOrDefault("totalDealers",        0));
                    orderStats.put("totalOrderValue",     body.getOrDefault("totalOrderValue",     0));
                    orderStats.put("totalCollected",      body.getOrDefault("totalCollected",      0));
                    orderStats.put("totalBalance",        body.getOrDefault("totalBalance",        0));
                    orderStats.put("activeDealerOrders",  body.getOrDefault("activeOrders",        0));
                    orderStats.put("deliveredOrders",     body.getOrDefault("deliveredOrders",     0));
                    orderStats.put("recentDealerOrders",  body.getOrDefault("recentDealerOrders",  java.util.List.of()));
                }
            } catch (Exception e) {
                log.warn("Failed to fetch order stats from Order Service for manager {}: {}", managerId, e.getMessage());
                orderStats.put("error", "Order Service unavailable");
            }
            dashboard.put("orderStats", orderStats);

            // ── Production flow stats ────────────────────────────────────────
            Map<String, Object> productionStats = new HashMap<>();
            productionStats.put("totalOrderFlows",      managerOrderFlowRepo.count());
            productionStats.put("notStarted",           managerOrderFlowRepo.countByProductStstus(ManagerOrderFlow.ProductStatus.NOT_STARTED));
            productionStats.put("inProduction",         managerOrderFlowRepo.countByProductStstus(ManagerOrderFlow.ProductStatus.IN_PROGRESS));
            productionStats.put("productionCompleted",  managerOrderFlowRepo.countByProductStstus(ManagerOrderFlow.ProductStatus.COMPLETED));
            productionStats.put("qcPending",            managerOrderFlowRepo.countByQualityCheck(ManagerOrderFlow.QualityCheck.PENDING));
            productionStats.put("qcApproved",           managerOrderFlowRepo.countByQualityCheck(ManagerOrderFlow.QualityCheck.APPROVED));
            productionStats.put("qcRejected",           managerOrderFlowRepo.countByQualityCheck(ManagerOrderFlow.QualityCheck.REJECTED));
            productionStats.put("readyForShipping",     managerOrderFlowRepo.countByShippingStatus(ManagerOrderFlow.ShippingStatus.READY_FOR_SHIPPING));
            productionStats.put("shipped",              managerOrderFlowRepo.countByShippingStatus(ManagerOrderFlow.ShippingStatus.SHIPPED));
            dashboard.put("productionStats", productionStats);

            // ── Support case stats ───────────────────────────────────────────
            Map<String, Object> supportStats = new HashMap<>();
            supportStats.put("openCases",       customerSupportCaseRepo.countByStatus(CustomerSupportCase.CaseStatus.OPEN));
            supportStats.put("inProgressCases", customerSupportCaseRepo.countByStatus(CustomerSupportCase.CaseStatus.IN_PROGRESS));
            supportStats.put("resolvedCases",   customerSupportCaseRepo.countByStatus(CustomerSupportCase.CaseStatus.RESOLVED));
            dashboard.put("supportStats", supportStats);

            // ── Reports + price change stats ─────────────────────────────────
            Map<String, Object> reportStats = new HashMap<>();
            reportStats.put("unreadReports",            ownerReportsRepo.countByIsReadFalse());
            reportStats.put("pendingPriceChanges",      productPriceUpdatedRepo.countByOwnerApprovalIsNull());
            reportStats.put("approvedPriceChanges",     productPriceUpdatedRepo.countByOwnerApprovalTrue());
            reportStats.put("rejectedPriceChanges",     productPriceUpdatedRepo.countByOwnerApprovalFalse());
            dashboard.put("reportStats", reportStats);

            return ResponseEntity.ok(dashboard);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch dashboard stats: " + e.getMessage()));
        }
    }
}
