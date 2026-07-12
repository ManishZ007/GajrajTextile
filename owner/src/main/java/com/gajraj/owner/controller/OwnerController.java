package com.gajraj.owner.controller;

import com.gajraj.owner.service.OwnerService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/owner")
public class OwnerController {

    private final OwnerService ownerService;

    public OwnerController(OwnerService ownerService) {
        this.ownerService = ownerService;
    }

    // ── Dashboard ────────────────────────────────────────────

    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard() {
        try {
            return ResponseEntity.ok(ownerService.getDashboard());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ── Reports ──────────────────────────────────────────────

    @GetMapping("/reports")
    public ResponseEntity<?> getAllReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String reportType,
            @RequestParam(required = false) String readStatus,
            @RequestParam(required = false) String approvalStatus) {
        try {
            return ownerService.getAllReports(page, size, reportType, readStatus, approvalStatus);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/reports/{reportId}")
    public ResponseEntity<?> getReportById(@PathVariable UUID reportId) {
        try {
            return ownerService.getReportById(reportId);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/reports/approve/{reportId}")
    public ResponseEntity<?> approveReport(@PathVariable UUID reportId) {
        try {
            return ownerService.approveReport(reportId);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/reports/reject/{reportId}")
    public ResponseEntity<?> rejectReport(@PathVariable UUID reportId) {
        try {
            return ownerService.rejectReport(reportId);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ── Price Changes ────────────────────────────────────────

    @GetMapping("/price-changes")
    public ResponseEntity<?> getAllPriceChanges(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String approvalStatus,
            @RequestParam(required = false) String productId) {
        try {
            return ownerService.getAllPriceChanges(page, size, approvalStatus, productId);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/price-changes/approve/{priceChangeId}")
    public ResponseEntity<?> approvePriceChange(@PathVariable UUID priceChangeId) {
        try {
            return ownerService.approvePriceChange(priceChangeId);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/price-changes/reject/{priceChangeId}")
    public ResponseEntity<?> rejectPriceChange(@PathVariable UUID priceChangeId) {
        try {
            return ownerService.rejectPriceChange(priceChangeId);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

}
