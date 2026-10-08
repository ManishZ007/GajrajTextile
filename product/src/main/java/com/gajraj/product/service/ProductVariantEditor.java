package com.gajraj.product.service;
import com.gajraj.product.dto.ProductCreateRequestDTO.VariantRequest;
import com.gajraj.product.model.*;
import com.gajraj.product.repo.*;
import org.springframework.stereotype.Service;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.*;

/** Called inside the product transaction; existing variants and their audit records survive edits. */
@Service
public class ProductVariantEditor {
    private final ProductVariantsRepo variants;
    private final StockHistoryRepo history;
    private final jakarta.persistence.EntityManager entityManager;
    public ProductVariantEditor(ProductVariantsRepo variants, StockHistoryRepo history, jakarta.persistence.EntityManager entityManager) { this.variants=variants; this.history=history; this.entityManager=entityManager; }
    public void update(Products product, List<VariantRequest> requests) {
        if (requests == null) return;
        Map<UUID,ProductVariants> existing = new LinkedHashMap<>();
        product.getVariants().stream().sorted(Comparator.comparing(ProductVariants::getVariantId)).forEach(v ->
            existing.put(v.getVariantId(), variants.lockStock(v.getVariantId()).orElseThrow()));
        Set<UUID> seen = new HashSet<>();
        for (var request : requests) {
            if (request.getVariantId() == null) {
                if (request.getStockQuantity() != null && request.getStockQuantity() != 0)
                    throw new IllegalArgumentException("Add new variants with zero stock, then restock through Inventory");
                product.getVariants().add(create(product, request));
                continue;
            }
            var variant = existing.get(request.getVariantId());
            if (variant == null || !seen.add(request.getVariantId())) throw new IllegalArgumentException("Invalid or duplicate variant ID");
            entityManager.refresh(variant, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
            if (request.getStockQuantity() != null && !request.getStockQuantity().equals(variant.getStockQuantity()))
                throw new IllegalArgumentException("Change stock through Inventory; product edits cannot replace stock");
            variant.setSize(request.getSize()); variant.setColor(request.getColor()); variant.setPrice(request.getPrice());
            variant.setSku(request.getSku());
            variant.setStatus(variant.getStockQuantity() == 0 && "ACTIVE".equals(request.getStatus()) ? "OUT_OF_STOCK" : request.getStatus());
        }
        if (seen.size() != existing.size()) throw new IllegalArgumentException("Existing variants cannot be removed here. Mark them INACTIVE to preserve order and stock history.");
    }
    public ProductVariants create(Products product, VariantRequest request) {
        int stock = request.getStockQuantity() == null ? 0 : request.getStockQuantity();
        if (stock < 0) throw new IllegalArgumentException("Initial stock cannot be negative");
        var variant = new ProductVariants(); variant.setProduct(product);
        variant.setSize(request.getSize()); variant.setColor(request.getColor()); variant.setPrice(request.getPrice());
        variant.setStockQuantity(stock); variant.setSku(request.getSku());
        variant.setStatus(stock == 0 && "ACTIVE".equals(request.getStatus()) ? "OUT_OF_STOCK" : request.getStatus());
        variants.save(variant);
        if (stock > 0) {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) throw new IllegalStateException("Signed staff identity is required");
            var entry = new StockHistory(); entry.setVariant(variant); entry.setPreviousQuantity(0); entry.setNewQuantity(stock);
            entry.setChangeAmount(stock); entry.setChangeType(StockHistory.ChangeType.MANUAL_INCREASE);
            entry.setChangedBy(auth.getName()); entry.setReason("Initial stock when product was created"); history.save(entry);
        }
        return variant;
    }
}
