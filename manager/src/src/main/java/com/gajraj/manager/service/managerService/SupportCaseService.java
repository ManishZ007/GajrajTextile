package com.gajraj.manager.service.managerService;

import com.gajraj.manager.dto.supportDTO.SupportCaseCreateDTO;
import com.gajraj.manager.dto.supportDTO.SupportCaseListDTO;
import com.gajraj.manager.dto.supportDTO.SupportCaseResponseDTO;
import com.gajraj.manager.model.CustomerSupportCase;
import com.gajraj.manager.repo.CustomerSupportCaseRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SupportCaseService {

    @Autowired
    private CustomerSupportCaseRepo supportCaseRepo;

    @Transactional(readOnly = true)
    public ResponseEntity<?> getAllCases(int page, int size, String status, String issueType, String search) {
        try {
            Specification<CustomerSupportCase> spec = (root, query, cb) -> cb.conjunction();

            if (status != null && !status.isBlank()) {
                try {
                    CustomerSupportCase.CaseStatus caseStatus = CustomerSupportCase.CaseStatus.valueOf(status.toUpperCase());
                    spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), caseStatus));
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Invalid status: " + status));
                }
            }

            if (issueType != null && !issueType.isBlank()) {
                spec = spec.and((root, query, cb) ->
                        cb.like(cb.lower(root.get("issueType")), "%" + issueType.toLowerCase() + "%"));
            }

            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.toLowerCase() + "%";
                spec = spec.and((root, query, cb) -> cb.or(
                        cb.like(cb.lower(root.get("orderId")), pattern),
                        cb.like(cb.lower(root.get("customerId")), pattern)
                ));
            }

            PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
            Page<CustomerSupportCase> resultPage = supportCaseRepo.findAll(spec, pageRequest);

            List<SupportCaseResponseDTO> content = resultPage.getContent()
                    .stream()
                    .map(this::mapToDTO)
                    .collect(Collectors.toList());

            SupportCaseListDTO response = new SupportCaseListDTO();
            response.setContent(content);
            response.setTotalElements(resultPage.getTotalElements());
            response.setTotalPages(resultPage.getTotalPages());
            response.setCurrentPage(page);
            response.setPageSize(size);
            response.setTotalCases(supportCaseRepo.count());
            response.setOpenCount(supportCaseRepo.countByStatus(CustomerSupportCase.CaseStatus.OPEN));
            response.setInProgressCount(supportCaseRepo.countByStatus(CustomerSupportCase.CaseStatus.IN_PROGRESS));
            response.setResolvedCount(supportCaseRepo.countByStatus(CustomerSupportCase.CaseStatus.RESOLVED));

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch support cases: " + e.getMessage()));
        }
    }

    public ResponseEntity<?> getCaseById(UUID id) {
        try {
            Optional<CustomerSupportCase> existing = supportCaseRepo.findById(id);
            if (existing.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Support case not found"));
            }
            return ResponseEntity.ok(mapToDTO(existing.get()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch support case: " + e.getMessage()));
        }
    }

    public ResponseEntity<?> createCase(SupportCaseCreateDTO dto) {
        try {
            if (dto.getIssueType() == null || dto.getIssueType().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "issueType is required"));
            }
            if (dto.getDescription() == null || dto.getDescription().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "description is required"));
            }

            CustomerSupportCase newCase = new CustomerSupportCase();
            newCase.setOrderId(dto.getOrderId());
            newCase.setCustomerId(dto.getCustomerId());
            newCase.setIssueType(dto.getIssueType());
            newCase.setDescription(dto.getDescription());
            newCase.setHandledBy(dto.getHandledBy());
            newCase.setStatus(CustomerSupportCase.CaseStatus.OPEN);

            CustomerSupportCase saved = supportCaseRepo.save(newCase);
            return ResponseEntity.status(HttpStatus.CREATED).body(mapToDTO(saved));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to create support case: " + e.getMessage()));
        }
    }

    public ResponseEntity<?> updateCase(UUID id, String status, String handledBy, String resolutionNote) {
        try {
            Optional<CustomerSupportCase> existing = supportCaseRepo.findById(id);
            if (existing.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Support case not found"));
            }

            CustomerSupportCase supportCase = existing.get();

            if (status != null && !status.isBlank()) {
                CustomerSupportCase.CaseStatus newStatus;
                try {
                    newStatus = CustomerSupportCase.CaseStatus.valueOf(status.toUpperCase());
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Invalid status: " + status));
                }

                if (newStatus == CustomerSupportCase.CaseStatus.RESOLVED) {
                    if (resolutionNote == null || resolutionNote.isBlank()) {
                        return ResponseEntity.badRequest()
                                .body(Map.of("error", "resolutionNote is required when status is RESOLVED"));
                    }
                    supportCase.setResolutionNote(resolutionNote);
                }

                supportCase.setStatus(newStatus);
            }

            if (handledBy != null && !handledBy.isBlank()) {
                supportCase.setHandledBy(handledBy);
            }

            if (resolutionNote != null && !resolutionNote.isBlank()) {
                supportCase.setResolutionNote(resolutionNote);
            }

            CustomerSupportCase saved = supportCaseRepo.save(supportCase);
            return ResponseEntity.ok(mapToDTO(saved));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to update support case: " + e.getMessage()));
        }
    }

    public ResponseEntity<?> deleteCase(UUID id) {
        try {
            Optional<CustomerSupportCase> existing = supportCaseRepo.findById(id);
            if (existing.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Support case not found"));
            }

            if (existing.get().getStatus() != CustomerSupportCase.CaseStatus.OPEN) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Only OPEN cases can be deleted"));
            }

            supportCaseRepo.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Support case deleted"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to delete support case: " + e.getMessage()));
        }
    }

    @Transactional(readOnly = true)
    public ResponseEntity<?> getStats() {
        try {
            long total = supportCaseRepo.count();
            long open = supportCaseRepo.countByStatus(CustomerSupportCase.CaseStatus.OPEN);
            long inProgress = supportCaseRepo.countByStatus(CustomerSupportCase.CaseStatus.IN_PROGRESS);
            long resolved = supportCaseRepo.countByStatus(CustomerSupportCase.CaseStatus.RESOLVED);

            List<CustomerSupportCase> resolvedCases = supportCaseRepo.findAll(
                    (root, query, cb) -> cb.equal(root.get("status"), CustomerSupportCase.CaseStatus.RESOLVED)
            );

            double avgResolutionHours = resolvedCases.stream()
                    .filter(c -> c.getCreatedAt() != null && c.getUpdatedAt() != null)
                    .mapToLong(c -> Duration.between(c.getCreatedAt(), c.getUpdatedAt()).toHours())
                    .average()
                    .orElse(0.0);

            List<CustomerSupportCase> allCases = supportCaseRepo.findAll();
            Map<String, Long> issueTypeCounts = allCases.stream()
                    .filter(c -> c.getIssueType() != null)
                    .collect(Collectors.groupingBy(CustomerSupportCase::getIssueType, Collectors.counting()));

            List<Map<String, Object>> topIssueTypes = issueTypeCounts.entrySet().stream()
                    .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                    .limit(5)
                    .map(e -> {
                        Map<String, Object> entry = new LinkedHashMap<>();
                        entry.put("issueType", e.getKey());
                        entry.put("count", e.getValue());
                        return entry;
                    })
                    .collect(Collectors.toList());

            Map<String, Object> stats = new LinkedHashMap<>();
            stats.put("total", total);
            stats.put("open", open);
            stats.put("inProgress", inProgress);
            stats.put("resolved", resolved);
            stats.put("avgResolutionHours", Math.round(avgResolutionHours * 100.0) / 100.0);
            stats.put("topIssueTypes", topIssueTypes);

            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch stats: " + e.getMessage()));
        }
    }

    private SupportCaseResponseDTO mapToDTO(CustomerSupportCase c) {
        SupportCaseResponseDTO dto = new SupportCaseResponseDTO();
        dto.setId(c.getId());
        dto.setOrderId(c.getOrderId());
        dto.setCustomerId(c.getCustomerId());
        dto.setIssueType(c.getIssueType());
        dto.setDescription(c.getDescription());
        dto.setStatus(c.getStatus() != null ? c.getStatus().name() : null);
        dto.setHandledBy(c.getHandledBy());
        dto.setResolutionNote(c.getResolutionNote());
        dto.setCreatedAt(c.getCreatedAt());
        dto.setUpdatedAt(c.getUpdatedAt());
        return dto;
    }
}
