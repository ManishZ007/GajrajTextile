package com.gajraj.manager.service.managerService;

import com.gajraj.manager.dto.reportDTO.ReportCreateDTO;
import com.gajraj.manager.dto.reportDTO.ReportListResponseDTO;
import com.gajraj.manager.dto.reportDTO.ReportResponseDTO;
import com.gajraj.manager.model.OwnerReports;
import com.gajraj.manager.repo.OwnerReportsRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ReportsService {

    @Autowired
    private OwnerReportsRepo ownerReportsRepo;

    @Transactional(readOnly = true)
    public ResponseEntity<?> getAllReports(int page, int size, String reportType, String readStatus, String approvalStatus) {
        try {

            Specification<OwnerReports> spec = (root, query, cb) -> cb.conjunction();
            if (reportType != null && !reportType.isBlank()) {
                try {
                    OwnerReports.ReportType type = OwnerReports.ReportType.valueOf(reportType.toUpperCase());
                    spec = spec.and((root, query, cb) -> cb.equal(root.get("reportType"), type));
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Invalid reportType: " + reportType));
                }
            }

            if (readStatus != null && !readStatus.isBlank()) {
                boolean isRead = readStatus.equalsIgnoreCase("read");
                spec = spec.and((root, query, cb) -> cb.equal(root.get("isRead"), isRead));
            }

            if (approvalStatus != null && !approvalStatus.isBlank()) {
                switch (approvalStatus.toLowerCase()) {
                    case "approved" ->
                        spec = spec.and((root, query, cb) -> cb.equal(root.get("approve"), true));
                    case "pending" ->
                        spec = spec.and((root, query, cb) -> cb.and(
                                cb.equal(root.get("approve"), false),
                                cb.equal(root.get("isRead"), false)
                        ));
                    case "rejected" ->
                        spec = spec.and((root, query, cb) -> cb.and(
                                cb.equal(root.get("approve"), false),
                                cb.equal(root.get("isRead"), true)
                        ));
                    default ->
                        spec = spec.and((root, query, cb) -> cb.conjunction());
                }
            }

            PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"));
            Page<OwnerReports> resultPage = ownerReportsRepo.findAll(spec, pageRequest);

            List<ReportResponseDTO> content = resultPage.getContent()
                    .stream()
                    .map(this::mapToDTO)
                    .collect(Collectors.toList());

            ReportListResponseDTO response = new ReportListResponseDTO();
            response.setContent(content);
            response.setTotalElements(resultPage.getTotalElements());
            response.setTotalPages(resultPage.getTotalPages());
            response.setCurrentPage(page);
            response.setPageSize(size);
            response.setTotalReports(ownerReportsRepo.count());
            response.setUnreadCount(ownerReportsRepo.countByIsReadFalse());
            response.setApprovedCount(ownerReportsRepo.countByApproveTrue());
            response.setPendingCount(ownerReportsRepo.countByApproveFalse());
            response.setWorkerPerformanceCount(ownerReportsRepo.countByReportType(OwnerReports.ReportType.WORKER_PERFORMANCE));
            response.setInventoryUpdateCount(ownerReportsRepo.countByReportType(OwnerReports.ReportType.INVENTORY_UPDATE));
            response.setCustomerIssueCount(ownerReportsRepo.countByReportType(OwnerReports.ReportType.CUSTOMER_ISSUE));

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch reports: " + e.getMessage()));
        }
    }

    @Transactional
    public ResponseEntity<?> getReportById(UUID reportId) {
        try {
            Optional<OwnerReports> existing = ownerReportsRepo.findById(reportId);
            if (existing.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Report not found"));
            }
            OwnerReports report = existing.get();
            if (Boolean.FALSE.equals(report.getIsRead())) {
                report.setIsRead(true);
                report = ownerReportsRepo.save(report);
            }
            return ResponseEntity.ok(mapToDTO(report));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch report: " + e.getMessage()));
        }
    }

    public ResponseEntity<?> createReport(ReportCreateDTO dto) {
        try {
            if (dto.getReportType() == null || dto.getReportType().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "reportType is required"));
            }
            if (dto.getDescription() == null || dto.getDescription().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "description is required"));
            }
            if (dto.getReportedBy() == null || dto.getReportedBy().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "reportedBy is required"));
            }

            OwnerReports.ReportType type;
            try {
                type = OwnerReports.ReportType.valueOf(dto.getReportType().toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid reportType: " + dto.getReportType()));
            }

            OwnerReports report = new OwnerReports();
            report.setReportType(type);
            report.setDescription(dto.getDescription());
            report.setReportedBy(dto.getReportedBy());
            report.setIsRead(false);
            report.setApprove(false);

            OwnerReports saved = ownerReportsRepo.save(report);
            return ResponseEntity.status(HttpStatus.CREATED).body(mapToDTO(saved));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to create report: " + e.getMessage()));
        }
    }

    public ResponseEntity<?> updateReport(UUID reportId, ReportCreateDTO dto) {
        try {
            Optional<OwnerReports> existing = ownerReportsRepo.findById(reportId);
            if (existing.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Report not found"));
            }

            OwnerReports report = existing.get();

            if (Boolean.TRUE.equals(report.getIsRead())) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Cannot edit a report that has already been read by the owner"));
            }

            if (dto.getDescription() != null && !dto.getDescription().isBlank()) {
                report.setDescription(dto.getDescription());
            }
            if (dto.getReportType() != null && !dto.getReportType().isBlank()) {
                try {
                    report.setReportType(OwnerReports.ReportType.valueOf(dto.getReportType().toUpperCase()));
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Invalid reportType: " + dto.getReportType()));
                }
            }

            OwnerReports saved = ownerReportsRepo.save(report);
            return ResponseEntity.ok(mapToDTO(saved));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to update report: " + e.getMessage()));
        }
    }

    public ResponseEntity<?> deleteReport(UUID reportId) {
        try {
            Optional<OwnerReports> existing = ownerReportsRepo.findById(reportId);
            if (existing.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Report not found"));
            }

            if (Boolean.TRUE.equals(existing.get().getIsRead())) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Cannot delete a report that has already been read"));
            }

            ownerReportsRepo.deleteById(reportId);
            return ResponseEntity.ok(Map.of("message", "Report deleted"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to delete report: " + e.getMessage()));
        }
    }

    public ResponseEntity<?> markAsRead(UUID reportId) {
        try {
            Optional<OwnerReports> existing = ownerReportsRepo.findById(reportId);
            if (existing.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Report not found"));
            }

            OwnerReports report = existing.get();
            report.setIsRead(true);

            OwnerReports saved = ownerReportsRepo.save(report);
            return ResponseEntity.ok(mapToDTO(saved));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to mark report as read: " + e.getMessage()));
        }
    }

    public ResponseEntity<?> approveReport(UUID reportId, boolean approved) {
        try {
            Optional<OwnerReports> existing = ownerReportsRepo.findById(reportId);
            if (existing.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Report not found"));
            }

            OwnerReports report = existing.get();
            report.setApprove(approved);
            report.setIsRead(true);

            OwnerReports saved = ownerReportsRepo.save(report);
            return ResponseEntity.ok(mapToDTO(saved));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to approve report: " + e.getMessage()));
        }
    }

    private ReportResponseDTO mapToDTO(OwnerReports report) {
        ReportResponseDTO dto = new ReportResponseDTO();
        dto.setId(report.getId());
        dto.setReportType(report.getReportType() != null ? report.getReportType().name() : null);
        dto.setDescription(report.getDescription());
        dto.setReportedBy(report.getReportedBy());
        dto.setIsRead(report.getIsRead());
        dto.setApprove(report.getApprove());
        dto.setUpdatedAt(report.getUpdatedAt());
        return dto;
    }
}
