package com.gajraj.manager.service.managerService;

import com.gajraj.manager.dto.priceChangeDTO.PriceChangeCreateDTO;
import com.gajraj.manager.dto.priceChangeDTO.PriceChangeListResponseDTO;
import com.gajraj.manager.dto.priceChangeDTO.PriceChangeResponseDTO;
import com.gajraj.manager.model.OwnerReports;
import com.gajraj.manager.model.ProductPriceUpdates;
import com.gajraj.manager.repo.OwnerReportsRepo;
import com.gajraj.manager.repo.ProductPriceUpdatedRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PriceChangeService {

    @Autowired
    private ProductPriceUpdatedRepo productPriceUpdatedRepo;

    @Autowired
    private OwnerReportsRepo ownerReportsRepo;

    @Transactional(readOnly = true)
    public ResponseEntity<?> getAllPriceChanges(int page, int size, String approvalStatus, String productId) {
        try {
            Specification<ProductPriceUpdates> spec = (root, query, cb) -> cb.conjunction();

            if (approvalStatus != null && !approvalStatus.isBlank()) {
                switch (approvalStatus.toUpperCase()) {
                    case "PENDING" ->
                        spec = spec.and((root, query, cb) -> cb.isNull(root.get("ownerApproval")));
                    case "APPROVED" ->
                        spec = spec.and((root, query, cb) -> cb.equal(root.get("ownerApproval"), true));
                    case "REJECTED" ->
                        spec = spec.and((root, query, cb) -> cb.equal(root.get("ownerApproval"), false));
                    default ->
                        spec = spec.and((root, query, cb) -> cb.conjunction());
                }
            }

            if (productId != null && !productId.isBlank()) {
                spec = spec.and((root, query, cb) -> cb.equal(root.get("productId"), productId));
            }

            PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"));
            Page<ProductPriceUpdates> resultPage = productPriceUpdatedRepo.findAll(spec, pageRequest);

            List<PriceChangeResponseDTO> content = resultPage.getContent()
                    .stream()
                    .map(this::mapToDTO)
                    .collect(Collectors.toList());

            PriceChangeListResponseDTO response = new PriceChangeListResponseDTO();
            response.setContent(content);
            response.setTotalElements(resultPage.getTotalElements());
            response.setTotalPages(resultPage.getTotalPages());
            response.setCurrentPage(page);
            response.setPageSize(size);
            response.setTotalRequests(productPriceUpdatedRepo.count());
            response.setPendingCount(productPriceUpdatedRepo.countByOwnerApprovalIsNull());
            response.setApprovedCount(productPriceUpdatedRepo.countByOwnerApprovalTrue());
            response.setRejectedCount(productPriceUpdatedRepo.countByOwnerApprovalFalse());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch price changes: " + e.getMessage()));
        }
    }

    @Transactional
    public ResponseEntity<?> createPriceChange(PriceChangeCreateDTO dto) {
        try {
            if (dto.getProductId() == null || dto.getProductId().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "productId is required"));
            }
            if (dto.getOldPrice() == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "oldPrice is required"));
            }
            if (dto.getNewPrice() == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "newPrice is required"));
            }
            if (dto.getReason() == null || dto.getReason().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "reason is required"));
            }
            if (dto.getUpdatedBy() == null || dto.getUpdatedBy().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "updatedBy is required"));
            }
            if (dto.getOldPrice().compareTo(dto.getNewPrice()) == 0) {
                return ResponseEntity.badRequest().body(Map.of("error", "newPrice must be different from oldPrice"));
            }

            OwnerReports ownerReport = new OwnerReports();
            ownerReport.setReportType(OwnerReports.ReportType.INVENTORY_UPDATE);
            ownerReport.setDescription("Price change request for product " + dto.getProductId()
                    + ": ₹" + dto.getOldPrice() + " → ₹" + dto.getNewPrice()
                    + ". Reason: " + dto.getReason());
            ownerReport.setReportedBy(dto.getUpdatedBy());
            ownerReport.setIsRead(false);
            ownerReport.setApprove(false);

            OwnerReports savedReport = ownerReportsRepo.save(ownerReport);

            ProductPriceUpdates priceChange = new ProductPriceUpdates();
            priceChange.setProductId(dto.getProductId());
            priceChange.setOldPrice(dto.getOldPrice());
            priceChange.setNewPrice(dto.getNewPrice());
            priceChange.setReason(dto.getReason());
            priceChange.setUpdatedBy(dto.getUpdatedBy());
            priceChange.setOwnerApproval(null);
            priceChange.setOwnerReport(savedReport);

            ProductPriceUpdates saved = productPriceUpdatedRepo.save(priceChange);
            return ResponseEntity.status(HttpStatus.CREATED).body(mapToDTO(saved));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to create price change: " + e.getMessage()));
        }
    }

    @Transactional
    public ResponseEntity<?> approvePriceChange(UUID priceChangeId, boolean approved) {
        try {
            Optional<ProductPriceUpdates> existing = productPriceUpdatedRepo.findById(priceChangeId);
            if (existing.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Price change not found"));
            }

            ProductPriceUpdates priceChange = existing.get();

            if (priceChange.getOwnerApproval() != null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "This price change has already been reviewed"));
            }

            priceChange.setOwnerApproval(approved);

            if (priceChange.getOwnerReport() != null) {
                OwnerReports report = priceChange.getOwnerReport();
                report.setApprove(approved);
                report.setIsRead(true);
                ownerReportsRepo.save(report);
            }

            ProductPriceUpdates saved = productPriceUpdatedRepo.save(priceChange);
            return ResponseEntity.ok(mapToDTO(saved));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to approve price change: " + e.getMessage()));
        }
    }

    @Transactional
    public ResponseEntity<?> deletePriceChange(UUID priceChangeId) {
        try {
            Optional<ProductPriceUpdates> existing = productPriceUpdatedRepo.findById(priceChangeId);
            if (existing.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Price change not found"));
            }

            ProductPriceUpdates priceChange = existing.get();

            if (priceChange.getOwnerApproval() != null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Cannot delete a reviewed price change"));
            }

            OwnerReports linkedReport = priceChange.getOwnerReport();

            productPriceUpdatedRepo.deleteById(priceChangeId);

            if (linkedReport != null) {
                ownerReportsRepo.deleteById(linkedReport.getId());
            }

            return ResponseEntity.ok(Map.of("message", "Price change request deleted"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to delete price change: " + e.getMessage()));
        }
    }

    private PriceChangeResponseDTO mapToDTO(ProductPriceUpdates p) {
        PriceChangeResponseDTO dto = new PriceChangeResponseDTO();
        dto.setId(p.getId());
        dto.setProductId(p.getProductId());
        dto.setProductName(null);
        dto.setOldPrice(p.getOldPrice());
        dto.setNewPrice(p.getNewPrice());

        if (p.getOldPrice() != null && p.getNewPrice() != null) {
            BigDecimal diff = p.getNewPrice().subtract(p.getOldPrice());
            dto.setPriceDifference(diff);

            if (p.getOldPrice().compareTo(BigDecimal.ZERO) != 0) {
                BigDecimal percent = diff.divide(p.getOldPrice(), 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                        .setScale(2, RoundingMode.HALF_UP);
                String sign = percent.compareTo(BigDecimal.ZERO) >= 0 ? "+" : "";
                dto.setPercentageChange(sign + percent + "%");
            }
        }

        dto.setUpdatedBy(p.getUpdatedBy());
        dto.setReason(p.getReason());
        dto.setOwnerApproval(p.getOwnerApproval());

        if (p.getOwnerApproval() == null) {
            dto.setApprovalStatus("PENDING");
        } else if (Boolean.TRUE.equals(p.getOwnerApproval())) {
            dto.setApprovalStatus("APPROVED");
        } else {
            dto.setApprovalStatus("REJECTED");
        }

        dto.setOwnerReportId(p.getOwnerReport() != null ? p.getOwnerReport().getId() : null);
        dto.setUpdatedAt(p.getUpdatedAt());
        return dto;
    }
}
