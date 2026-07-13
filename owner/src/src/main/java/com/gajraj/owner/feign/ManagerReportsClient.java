package com.gajraj.owner.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@FeignClient("MANAGER")
public interface ManagerReportsClient {

    // Reports
    @GetMapping("/manager/reports/all")
    ResponseEntity<?> getAllReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String reportType,
            @RequestParam(required = false) String readStatus,
            @RequestParam(required = false) String approvalStatus);

    @GetMapping("/manager/reports/{reportId}")
    ResponseEntity<?> getReportById(@PathVariable UUID reportId);

    @PutMapping("/manager/reports/mark-read/{reportId}")
    ResponseEntity<?> markAsRead(@PathVariable UUID reportId);

    @PutMapping("/manager/reports/approve/{reportId}")
    ResponseEntity<?> approveReport(@PathVariable UUID reportId, @RequestParam boolean approved);

    // Price changes
    @GetMapping("/manager/price-changes/all")
    ResponseEntity<?> getAllPriceChanges(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String approvalStatus,
            @RequestParam(required = false) String productId);

    @PutMapping("/manager/price-changes/approve/{priceChangeId}")
    ResponseEntity<?> approvePriceChange(@PathVariable UUID priceChangeId, @RequestParam boolean approved);

}
