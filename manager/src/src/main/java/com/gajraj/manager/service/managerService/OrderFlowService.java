package com.gajraj.manager.service.managerService;

import com.gajraj.manager.dto.orderFlowDTO.OrderFlowListDTO;
import com.gajraj.manager.dto.orderFlowDTO.OrderFlowResponseDTO;
import com.gajraj.manager.model.ManagerOrderFlow;
import com.gajraj.manager.repo.ManagerOrderFlowRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class OrderFlowService {

    @Autowired
    private ManagerOrderFlowRepo managerOrderFlowRepo;

    // ─── Internal: called by Order Service when order is confirmed ───────────

    public ResponseEntity<?> createOrderFlow(Map<String, String> request) {
        try {
            ManagerOrderFlow flow = new ManagerOrderFlow();
            flow.setOrderId(request.get("orderId"));
            flow.setProductStstus(ManagerOrderFlow.ProductStatus.NOT_STARTED);
            flow.setQualityCheck(ManagerOrderFlow.QualityCheck.PENDING);
            flow.setShippingStatus(ManagerOrderFlow.ShippingStatus.NOT_READY);
            flow.setAddressId(request.get("addressId"));
            flow.setHandledBy(null);
            flow.setNote(null);

            ManagerOrderFlow saved = managerOrderFlowRepo.save(flow);
            return ResponseEntity.status(HttpStatus.CREATED).body(mapToDTO(saved));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to create order flow: " + e.getMessage()));
        }
    }

    // ─── Internal: Order Service can query current status ───────────────────

    public ResponseEntity<?> getInternalStatus(String orderId) {
        try {
            Optional<ManagerOrderFlow> existing = managerOrderFlowRepo.findByOrderId(orderId);
            if (existing.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Order flow not found for orderId: " + orderId));
            }
            ManagerOrderFlow flow = existing.get();

            Map<String, Object> status = new LinkedHashMap<>();
            status.put("orderId", flow.getOrderId());
            status.put("productStatus", flow.getProductStstus() != null ? flow.getProductStstus().name() : null);
            status.put("qualityCheck", flow.getQualityCheck() != null ? flow.getQualityCheck().name() : null);
            status.put("shippingStatus", flow.getShippingStatus() != null ? flow.getShippingStatus().name() : null);
            status.put("currentStage", deriveCurrentStage(flow));
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch order status: " + e.getMessage()));
        }
    }

    // ─── Manager: list all order flows ──────────────────────────────────────

    @Transactional(readOnly = true)
    public ResponseEntity<?> getAllOrderFlows(int page, int size, String productStatus,
                                              String qualityCheck, String shippingStatus) {
        try {
            Specification<ManagerOrderFlow> spec = (root, query, cb) -> cb.conjunction();

            if (productStatus != null && !productStatus.isBlank()) {
                try {
                    ManagerOrderFlow.ProductStatus ps = ManagerOrderFlow.ProductStatus.valueOf(productStatus.toUpperCase());
                    spec = spec.and((root, query, cb) -> cb.equal(root.get("productStstus"), ps));
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Invalid productStatus: " + productStatus));
                }
            }

            if (qualityCheck != null && !qualityCheck.isBlank()) {
                try {
                    ManagerOrderFlow.QualityCheck qc = ManagerOrderFlow.QualityCheck.valueOf(qualityCheck.toUpperCase());
                    spec = spec.and((root, query, cb) -> cb.equal(root.get("qualityCheck"), qc));
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Invalid qualityCheck: " + qualityCheck));
                }
            }

            if (shippingStatus != null && !shippingStatus.isBlank()) {
                try {
                    ManagerOrderFlow.ShippingStatus ss = ManagerOrderFlow.ShippingStatus.valueOf(shippingStatus.toUpperCase());
                    spec = spec.and((root, query, cb) -> cb.equal(root.get("shippingStatus"), ss));
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Invalid shippingStatus: " + shippingStatus));
                }
            }

            PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"));
            Page<ManagerOrderFlow> resultPage = managerOrderFlowRepo.findAll(spec, pageRequest);

            List<OrderFlowResponseDTO> content = resultPage.getContent()
                    .stream().map(this::mapToDTO).collect(Collectors.toList());

            OrderFlowListDTO response = new OrderFlowListDTO();
            response.setContent(content);
            response.setTotalElements(resultPage.getTotalElements());
            response.setTotalPages(resultPage.getTotalPages());
            response.setCurrentPage(page);
            response.setPageSize(size);
            response.setTotalOrders(managerOrderFlowRepo.count());
            response.setNotStartedCount(managerOrderFlowRepo.countByProductStstus(ManagerOrderFlow.ProductStatus.NOT_STARTED));
            response.setInProgressCount(managerOrderFlowRepo.countByProductStstus(ManagerOrderFlow.ProductStatus.IN_PROGRESS));
            response.setCompletedCount(managerOrderFlowRepo.countByProductStstus(ManagerOrderFlow.ProductStatus.COMPLETED));
            response.setQcPendingCount(managerOrderFlowRepo.countByQualityCheck(ManagerOrderFlow.QualityCheck.PENDING));
            response.setQcApprovedCount(managerOrderFlowRepo.countByQualityCheck(ManagerOrderFlow.QualityCheck.APPROVED));
            response.setQcRejectedCount(managerOrderFlowRepo.countByQualityCheck(ManagerOrderFlow.QualityCheck.REJECTED));
            response.setReadyForShippingCount(managerOrderFlowRepo.countByShippingStatus(ManagerOrderFlow.ShippingStatus.READY_FOR_SHIPPING));
            response.setShippedCount(managerOrderFlowRepo.countByShippingStatus(ManagerOrderFlow.ShippingStatus.SHIPPED));

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch order flows: " + e.getMessage()));
        }
    }

    // ─── Manager: get single order flow ─────────────────────────────────────

    public ResponseEntity<?> getOrderFlowByOrderId(String orderId) {
        try {
            Optional<ManagerOrderFlow> existing = managerOrderFlowRepo.findByOrderId(orderId);
            if (existing.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Order flow not found for orderId: " + orderId));
            }
            return ResponseEntity.ok(mapToDTO(existing.get()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch order flow: " + e.getMessage()));
        }
    }

    // ─── Stage 1: Manager starts production ─────────────────────────────────
    // Requirement: productStatus = NOT_STARTED

    @Transactional
    public ResponseEntity<?> startProduction(String orderId, String handledBy) {
        try {
            Optional<ManagerOrderFlow> existing = managerOrderFlowRepo.findByOrderId(orderId);
            if (existing.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Order flow not found for orderId: " + orderId));
            }

            ManagerOrderFlow flow = existing.get();

            if (flow.getProductStstus() != ManagerOrderFlow.ProductStatus.NOT_STARTED) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Production can only be started when status is NOT_STARTED. Current: "
                                + flow.getProductStstus()));
            }

            flow.setProductStstus(ManagerOrderFlow.ProductStatus.IN_PROGRESS);
            flow.setHandledBy(handledBy);

            return ResponseEntity.ok(mapToDTO(managerOrderFlowRepo.save(flow)));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to start production: " + e.getMessage()));
        }
    }

    // ─── Stage 2: Manager completes production ───────────────────────────────
    // Requirement: productStatus = IN_PROGRESS

    @Transactional
    public ResponseEntity<?> completeProduction(String orderId) {
        try {
            Optional<ManagerOrderFlow> existing = managerOrderFlowRepo.findByOrderId(orderId);
            if (existing.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Order flow not found for orderId: " + orderId));
            }

            ManagerOrderFlow flow = existing.get();

            if (flow.getProductStstus() != ManagerOrderFlow.ProductStatus.IN_PROGRESS) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Production can only be completed when status is IN_PROGRESS. Current: "
                                + flow.getProductStstus()));
            }

            flow.setProductStstus(ManagerOrderFlow.ProductStatus.COMPLETED);

            return ResponseEntity.ok(mapToDTO(managerOrderFlowRepo.save(flow)));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to complete production: " + e.getMessage()));
        }
    }

    // ─── Stage 3: Quality check ──────────────────────────────────────────────
    // Requirement: productStatus = COMPLETED
    // If REJECTED → productStatus resets to IN_PROGRESS for rework

    @Transactional
    public ResponseEntity<?> updateQualityCheck(String orderId, String result, String note) {
        try {
            Optional<ManagerOrderFlow> existing = managerOrderFlowRepo.findByOrderId(orderId);
            if (existing.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Order flow not found for orderId: " + orderId));
            }

            ManagerOrderFlow flow = existing.get();

            if (flow.getProductStstus() != ManagerOrderFlow.ProductStatus.COMPLETED) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Quality check can only be done after production is COMPLETED. Current: "
                                + flow.getProductStstus()));
            }

            ManagerOrderFlow.QualityCheck qcResult;
            try {
                qcResult = ManagerOrderFlow.QualityCheck.valueOf(result.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid quality check result. Use APPROVED or REJECTED"));
            }

            if (qcResult == ManagerOrderFlow.QualityCheck.PENDING) {
                return ResponseEntity.badRequest().body(Map.of("error", "Quality check result must be APPROVED or REJECTED"));
            }

            flow.setQualityCheck(qcResult);
            if (note != null && !note.isBlank()) flow.setNote(note);

            if (qcResult == ManagerOrderFlow.QualityCheck.REJECTED) {
                // Reset to rework — manager must go through production again
                flow.setProductStstus(ManagerOrderFlow.ProductStatus.IN_PROGRESS);
            }

            return ResponseEntity.ok(mapToDTO(managerOrderFlowRepo.save(flow)));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to update quality check: " + e.getMessage()));
        }
    }

    // ─── Stage 4: Mark ready for shipping ────────────────────────────────────
    // Requirement: qualityCheck = APPROVED

    @Transactional
    public ResponseEntity<?> markReadyForShipping(String orderId) {
        try {
            Optional<ManagerOrderFlow> existing = managerOrderFlowRepo.findByOrderId(orderId);
            if (existing.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Order flow not found for orderId: " + orderId));
            }

            ManagerOrderFlow flow = existing.get();

            if (flow.getQualityCheck() != ManagerOrderFlow.QualityCheck.APPROVED) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Order must pass quality check (APPROVED) before marking ready for shipping. Current QC: "
                                + flow.getQualityCheck()));
            }

            if (flow.getShippingStatus() != ManagerOrderFlow.ShippingStatus.NOT_READY) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Shipping status is already: " + flow.getShippingStatus()));
            }

            flow.setShippingStatus(ManagerOrderFlow.ShippingStatus.READY_FOR_SHIPPING);

            return ResponseEntity.ok(mapToDTO(managerOrderFlowRepo.save(flow)));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to mark ready for shipping: " + e.getMessage()));
        }
    }

    // ─── Stage 5: Mark shipped ───────────────────────────────────────────────
    // Requirement: shippingStatus = READY_FOR_SHIPPING

    @Transactional
    public ResponseEntity<?> markShipped(String orderId) {
        try {
            Optional<ManagerOrderFlow> existing = managerOrderFlowRepo.findByOrderId(orderId);
            if (existing.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Order flow not found for orderId: " + orderId));
            }

            ManagerOrderFlow flow = existing.get();

            if (flow.getShippingStatus() != ManagerOrderFlow.ShippingStatus.READY_FOR_SHIPPING) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Order must be READY_FOR_SHIPPING before marking as SHIPPED. Current: "
                                + flow.getShippingStatus()));
            }

            flow.setShippingStatus(ManagerOrderFlow.ShippingStatus.SHIPPED);

            return ResponseEntity.ok(mapToDTO(managerOrderFlowRepo.save(flow)));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to mark as shipped: " + e.getMessage()));
        }
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private OrderFlowResponseDTO mapToDTO(ManagerOrderFlow flow) {
        OrderFlowResponseDTO dto = new OrderFlowResponseDTO();
        dto.setId(flow.getId());
        dto.setOrderId(flow.getOrderId());
        dto.setProductStatus(flow.getProductStstus() != null ? flow.getProductStstus().name() : null);
        dto.setQualityCheck(flow.getQualityCheck() != null ? flow.getQualityCheck().name() : null);
        dto.setShippingStatus(flow.getShippingStatus() != null ? flow.getShippingStatus().name() : null);
        dto.setAddressId(flow.getAddressId());
        dto.setHandledBy(flow.getHandledBy());
        dto.setNote(flow.getNote());
        dto.setUpdatedAt(flow.getUpdatedAt());
        dto.setCurrentStage(deriveCurrentStage(flow));
        return dto;
    }

    private String deriveCurrentStage(ManagerOrderFlow flow) {
        if (flow.getShippingStatus() == ManagerOrderFlow.ShippingStatus.SHIPPED) return "SHIPPED";
        if (flow.getShippingStatus() == ManagerOrderFlow.ShippingStatus.READY_FOR_SHIPPING) return "READY_FOR_SHIPPING";
        if (flow.getQualityCheck() == ManagerOrderFlow.QualityCheck.APPROVED) return "QUALITY_APPROVED";
        if (flow.getQualityCheck() == ManagerOrderFlow.QualityCheck.REJECTED) return "QUALITY_REJECTED_REWORK";
        if (flow.getProductStstus() == ManagerOrderFlow.ProductStatus.COMPLETED) return "AWAITING_QUALITY_CHECK";
        if (flow.getProductStstus() == ManagerOrderFlow.ProductStatus.IN_PROGRESS) return "PRODUCTION_IN_PROGRESS";
        return "AWAITING_START";
    }
}
