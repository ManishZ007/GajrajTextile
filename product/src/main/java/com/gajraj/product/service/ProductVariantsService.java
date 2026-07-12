package com.gajraj.product.service;

import com.gajraj.product.dto.VariantResponseDTO;
import com.gajraj.product.dto.VariantUpdateDTO;
import com.gajraj.product.model.ProductVariants;
import com.gajraj.product.model.StockHistory;
import com.gajraj.product.repo.ProductVariantsRepo;
import com.gajraj.product.repo.StockHistoryRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
public class ProductVariantsService {

    @Autowired
    private ProductVariantsRepo productVariantsRepo;

    @Autowired
    private StockHistoryRepo stockHistoryRepo;

    @Transactional(readOnly = true)
    public Map<String, Object> getAllVariants(int page, int size, String search, String status, UUID productId) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Specification<ProductVariants> spec = (root, query, cb) -> cb.conjunction();

        if (status != null && !status.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }
        if (productId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("product").get("productId"), productId));
        }
        if (search != null && !search.isBlank()) {
            String pattern = "%" + search.toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.or(
                    cb.like(cb.lower(root.get("sku")), pattern),
                    cb.like(cb.lower(root.get("product").get("name")), pattern)
            ));
        }

        Page<ProductVariants> variantPage = productVariantsRepo.findAll(spec, pageable);

        List<VariantResponseDTO> content = variantPage.getContent().stream()
                .map(this::toDTO)
                .toList();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("content", content);
        response.put("totalElements", variantPage.getTotalElements());
        response.put("totalPages", variantPage.getTotalPages());
        response.put("currentPage", page);
        response.put("pageSize", size);
        return response;
    }

    @Transactional
    public VariantResponseDTO updateVariant(UUID variantId, VariantUpdateDTO dto) {
        ProductVariants variant = productVariantsRepo.findById(variantId)
                .orElseThrow(() -> new NoSuchElementException("Variant not found: " + variantId));

        if (dto.getSku() != null && !dto.getSku().equals(variant.getSku())) {
            productVariantsRepo.findBySkuAndVariantIdNot(dto.getSku(), variantId).ifPresent(existing -> {
                throw new IllegalStateException("SKU '" + dto.getSku() + "' is already in use by another variant");
            });
            variant.setSku(dto.getSku());
        }
        if (dto.getPrice() != null) variant.setPrice(dto.getPrice());
        if (dto.getStockQuantity() != null) variant.setStockQuantity(dto.getStockQuantity());
        if (dto.getStatus() != null) variant.setStatus(dto.getStatus());
        if (dto.getSize() != null) variant.setSize(dto.getSize());
        if (dto.getColor() != null) variant.setColor(dto.getColor());

        return toDTO(productVariantsRepo.save(variant));
    }

    @Transactional
    public void deleteVariant(UUID variantId) {
        ProductVariants variant = productVariantsRepo.findById(variantId)
                .orElseThrow(() -> new NoSuchElementException("Variant not found: " + variantId));
        productVariantsRepo.delete(variant);
    }

    @Transactional
    public Map<String, Object> decrementStock(UUID variantId, int quantity) {
        ProductVariants variant = productVariantsRepo.findById(variantId)
                .orElseThrow(() -> new NoSuchElementException("Variant not found: " + variantId));

        if (variant.getStockQuantity() < quantity) {
            throw new IllegalArgumentException("Not enough stock. Available: " + variant.getStockQuantity());
        }

        int previousStock = variant.getStockQuantity();
        variant.setStockQuantity(previousStock - quantity);
        if (variant.getStockQuantity() == 0) {
            variant.setStatus("OUT_OF_STOCK");
        }
        productVariantsRepo.save(variant);

        StockHistory history = new StockHistory();
        history.setVariant(variant);
        history.setChangeType(StockHistory.ChangeType.ORDER_DECREMENT);
        history.setPreviousQuantity(previousStock);
        history.setNewQuantity(variant.getStockQuantity());
        history.setChangeAmount(-quantity);
        history.setReason("Order placed");
        history.setChangedBy("SYSTEM");
        stockHistoryRepo.save(history);

        return Map.of("message", "Stock decremented", "remainingStock", variant.getStockQuantity());
    }

    @Transactional
    public Map<String, Object> incrementStock(UUID variantId, int quantity) {
        ProductVariants variant = productVariantsRepo.findById(variantId)
                .orElseThrow(() -> new NoSuchElementException("Variant not found: " + variantId));

        int previousStock = variant.getStockQuantity();
        variant.setStockQuantity(previousStock + quantity);
        if ("OUT_OF_STOCK".equals(variant.getStatus())) {
            variant.setStatus("ACTIVE");
        }
        productVariantsRepo.save(variant);

        StockHistory history = new StockHistory();
        history.setVariant(variant);
        history.setChangeType(StockHistory.ChangeType.ORDER_RESTOCK);
        history.setPreviousQuantity(previousStock);
        history.setNewQuantity(variant.getStockQuantity());
        history.setChangeAmount(quantity);
        history.setReason("Order cancelled - restock");
        history.setChangedBy("SYSTEM");
        stockHistoryRepo.save(history);

        return Map.of("message", "Stock incremented", "currentStock", variant.getStockQuantity());
    }

    private VariantResponseDTO toDTO(ProductVariants v) {
        return new VariantResponseDTO(
                v.getVariantId(),
                v.getProduct().getName(),
                v.getProduct().getProductId(),
                v.getProduct().getCategory().getName(),
                v.getSize(),
                v.getColor(),
                v.getPrice(),
                v.getStockQuantity(),
                v.getSku(),
                v.getStatus(),
                v.getCreatedAt()
        );
    }
}
