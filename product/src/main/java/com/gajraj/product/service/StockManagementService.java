package com.gajraj.product.service;

import com.gajraj.product.dto.InventoryItemDTO;
import com.gajraj.product.dto.InventoryListResponseDTO;
import com.gajraj.product.dto.StockHistoryDTO;
import com.gajraj.product.dto.StockHistoryListResponseDTO;
import com.gajraj.product.dto.StockUpdateDTO;
import com.gajraj.product.model.ProductVariants;
import com.gajraj.product.model.StockHistory;
import com.gajraj.product.repo.ProductImagesRepo;
import com.gajraj.product.repo.ProductVariantsRepo;
import com.gajraj.product.repo.StockHistoryRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
public class StockManagementService {

    @Autowired
    private ProductVariantsRepo productVariantsRepo;

    @Autowired
    private StockHistoryRepo stockHistoryRepo;

    @Autowired
    private ProductImagesRepo productImagesRepo;

    @Autowired
    private S3Service s3Service;

    @Transactional(readOnly = true)
    public InventoryListResponseDTO getAllInventory(int page, int size, String stockLevel, String search, UUID categoryId, String sortBy) {
        Sort sort = switch (sortBy != null ? sortBy : "newest") {
            case "stock_asc" -> Sort.by(Sort.Direction.ASC, "stockQuantity");
            case "stock_desc" -> Sort.by(Sort.Direction.DESC, "stockQuantity");
            case "name" -> Sort.by(Sort.Direction.ASC, "product.name");
            default -> Sort.by(Sort.Direction.DESC, "createdAt");
        };
        PageRequest pageable = PageRequest.of(page, size, sort);

        Specification<ProductVariants> spec = (root, query, cb) -> cb.conjunction();

        if (search != null && !search.isBlank()) {
            String pattern = "%" + search.toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.or(
                    cb.like(cb.lower(root.get("sku")), pattern),
                    cb.like(cb.lower(root.get("product").get("name")), pattern)
            ));
        }
        if (categoryId != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("product").get("category").get("categoryId"), categoryId));
        }
        if (stockLevel != null && !stockLevel.isBlank()) {
            spec = spec.and(switch (stockLevel.toUpperCase()) {
                case "OUT_OF_STOCK" -> (root, query, cb) -> cb.equal(root.get("stockQuantity"), 0);
                case "LOW" -> (root, query, cb) -> cb.and(
                        cb.greaterThan(root.get("stockQuantity"), 0),
                        cb.lessThan(root.get("stockQuantity"), 5)
                );
                case "GOOD" -> (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("stockQuantity"), 5);
                default -> (root, query, cb) -> cb.conjunction();
            });
        }

        Page<ProductVariants> variantPage = productVariantsRepo.findAll(spec, pageable);

        List<InventoryItemDTO> content = variantPage.getContent().stream()
                .map(this::toInventoryItemDTO)
                .toList();

        return new InventoryListResponseDTO(
                content,
                variantPage.getTotalElements(),
                variantPage.getTotalPages(),
                page,
                size,
                productVariantsRepo.count(),
                productVariantsRepo.countByStockQuantityGreaterThan(0),
                productVariantsRepo.countLowStock(),
                productVariantsRepo.countByStockQuantityEquals(0),
                productVariantsRepo.sumAllStock()
        );
    }

    @Transactional(readOnly = true)
    public InventoryListResponseDTO getLowStockItems(int page, int size, int threshold) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "stockQuantity"));

        Specification<ProductVariants> spec = (root, query, cb) -> cb.and(
                cb.greaterThan(root.get("stockQuantity"), 0),
                cb.lessThanOrEqualTo(root.get("stockQuantity"), threshold)
        );

        Page<ProductVariants> variantPage = productVariantsRepo.findAll(spec, pageable);

        List<InventoryItemDTO> content = variantPage.getContent().stream()
                .map(this::toInventoryItemDTO)
                .toList();

        return new InventoryListResponseDTO(
                content,
                variantPage.getTotalElements(),
                variantPage.getTotalPages(),
                page,
                size,
                productVariantsRepo.count(),
                productVariantsRepo.countByStockQuantityGreaterThan(0),
                productVariantsRepo.countLowStock(),
                productVariantsRepo.countByStockQuantityEquals(0),
                productVariantsRepo.sumAllStock()
        );
    }

    @Transactional
    public InventoryItemDTO updateStock(UUID variantId, StockUpdateDTO dto) {
        if (dto.getReason() == null || dto.getReason().isBlank()) {
            throw new IllegalArgumentException("reason is required");
        }
        if (dto.getNewQuantity() != null && dto.getAdjustmentAmount() != null) {
            throw new IllegalArgumentException("Provide either newQuantity or adjustmentAmount, not both");
        }
        if (dto.getNewQuantity() == null && dto.getAdjustmentAmount() == null) {
            throw new IllegalArgumentException("Either newQuantity or adjustmentAmount is required");
        }

        ProductVariants variant = productVariantsRepo.findById(variantId)
                .orElseThrow(() -> new NoSuchElementException("Variant not found: " + variantId));

        int previousStock = variant.getStockQuantity();
        int resultingQuantity;
        int changeAmount;
        StockHistory.ChangeType changeType;

        if (dto.getNewQuantity() != null) {
            if (dto.getNewQuantity() < 0) {
                throw new IllegalArgumentException("newQuantity cannot be negative");
            }
            resultingQuantity = dto.getNewQuantity();
            changeAmount = resultingQuantity - previousStock;
            changeType = StockHistory.ChangeType.ADJUSTMENT;
        } else {
            resultingQuantity = previousStock + dto.getAdjustmentAmount();
            if (resultingQuantity < 0) {
                throw new IllegalArgumentException(
                        "Adjustment would result in negative stock. Current: " + previousStock
                        + ", adjustment: " + dto.getAdjustmentAmount());
            }
            changeAmount = dto.getAdjustmentAmount();
            changeType = changeAmount > 0
                    ? StockHistory.ChangeType.MANUAL_INCREASE
                    : StockHistory.ChangeType.MANUAL_DECREASE;
        }

        variant.setStockQuantity(resultingQuantity);
        if (resultingQuantity == 0) {
            variant.setStatus("OUT_OF_STOCK");
        } else if (previousStock == 0 && resultingQuantity > 0) {
            variant.setStatus("ACTIVE");
        }
        productVariantsRepo.save(variant);

        StockHistory history = new StockHistory();
        history.setVariant(variant);
        history.setChangeType(changeType);
        history.setPreviousQuantity(previousStock);
        history.setNewQuantity(resultingQuantity);
        history.setChangeAmount(changeAmount);
        history.setReason(dto.getReason());
        history.setChangedBy(dto.getChangedBy());
        stockHistoryRepo.save(history);

        return toInventoryItemDTO(variant);
    }

    @Transactional
    public List<InventoryItemDTO> bulkUpdateStock(List<StockUpdateDTO.BulkStockUpdateItem> items) {
        List<InventoryItemDTO> results = new ArrayList<>();
        for (StockUpdateDTO.BulkStockUpdateItem item : items) {
            StockUpdateDTO dto = new StockUpdateDTO();
            dto.setNewQuantity(item.getNewQuantity());
            dto.setReason(item.getReason());
            dto.setChangedBy(item.getChangedBy());
            results.add(updateStock(item.getVariantId(), dto));
        }
        return results;
    }

    @Transactional(readOnly = true)
    public StockHistoryListResponseDTO getStockHistory(int page, int size, UUID variantId, String changeType) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        if (variantId != null || changeType != null) {
            Specification<StockHistory> spec = (root, query, cb) -> cb.conjunction();

            if (variantId != null) {
                spec = spec.and((root, query, cb) ->
                        cb.equal(root.get("variant").get("variantId"), variantId));
            }
            if (changeType != null && !changeType.isBlank()) {
                StockHistory.ChangeType type;
                try {
                    type = StockHistory.ChangeType.valueOf(changeType.toUpperCase());
                } catch (IllegalArgumentException e) {
                    throw new IllegalArgumentException("Invalid changeType: " + changeType);
                }
                final StockHistory.ChangeType finalType = type;
                spec = spec.and((root, query, cb) -> cb.equal(root.get("changeType"), finalType));
            }

            Page<StockHistory> historyPage = stockHistoryRepo.findAll(spec, pageable);
            return toHistoryResponse(historyPage, page, size);
        }

        Page<StockHistory> historyPage = stockHistoryRepo.findAllByOrderByCreatedAtDesc(pageable);
        return toHistoryResponse(historyPage, page, size);
    }

    @Transactional(readOnly = true)
    public StockHistoryListResponseDTO getVariantHistory(UUID variantId, int page, int size) {
        if (!productVariantsRepo.existsById(variantId)) {
            throw new NoSuchElementException("Variant not found: " + variantId);
        }
        PageRequest pageable = PageRequest.of(page, size);
        Page<StockHistory> historyPage = stockHistoryRepo
                .findByVariantVariantIdOrderByCreatedAtDesc(variantId, pageable);
        return toHistoryResponse(historyPage, page, size);
    }

    private StockHistoryListResponseDTO toHistoryResponse(Page<StockHistory> historyPage, int page, int size) {
        List<StockHistoryDTO> content = historyPage.getContent().stream()
                .map(this::toHistoryDTO)
                .toList();
        return new StockHistoryListResponseDTO(
                content,
                historyPage.getTotalElements(),
                historyPage.getTotalPages(),
                page,
                size
        );
    }

    private InventoryItemDTO toInventoryItemDTO(ProductVariants v) {
        String primaryImage = productImagesRepo.findByProductAndIsPrimaryTrue(v.getProduct())
                .map(img -> s3Service.generateViewUrl(img.getImageUrl()))
                .orElse(null);

        String stockLevelLabel;
        if (v.getStockQuantity() == 0) {
            stockLevelLabel = "OUT_OF_STOCK";
        } else if (v.getStockQuantity() < 5) {
            stockLevelLabel = "LOW";
        } else {
            stockLevelLabel = "GOOD";
        }

        return new InventoryItemDTO(
                v.getVariantId(),
                v.getProduct().getProductId(),
                v.getProduct().getName(),
                v.getProduct().getCategory().getName(),
                primaryImage,
                v.getSize(),
                v.getColor(),
                v.getPrice(),
                v.getStockQuantity(),
                v.getSku(),
                v.getStatus(),
                stockLevelLabel
        );
    }

    private StockHistoryDTO toHistoryDTO(StockHistory h) {
        return new StockHistoryDTO(
                h.getHistoryId(),
                h.getVariant().getVariantId(),
                h.getVariant().getProduct().getName(),
                h.getVariant().getSku(),
                h.getVariant().getColor(),
                h.getVariant().getSize(),
                h.getChangeType().name(),
                h.getPreviousQuantity(),
                h.getNewQuantity(),
                h.getChangeAmount(),
                h.getReason(),
                h.getChangedBy(),
                h.getCreatedAt()
        );
    }
}
