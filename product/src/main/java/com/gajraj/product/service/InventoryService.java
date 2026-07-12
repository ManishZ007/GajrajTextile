package com.gajraj.product.service;

import com.gajraj.product.dto.InventoryAuditLogDTO;
import com.gajraj.product.dto.InventoryResponseDTO;
import com.gajraj.product.dto.InventoryUpdateDTO;
import com.gajraj.product.model.Inventory;
import com.gajraj.product.model.InventoryAuditLog;
import com.gajraj.product.model.Products;
import com.gajraj.product.repo.InventoryAuditLogRepo;
import com.gajraj.product.repo.InventoryRepo;
import com.gajraj.product.repo.ProductsRepo;
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
public class InventoryService {

    @Autowired
    private InventoryRepo inventoryRepo;

    @Autowired
    private InventoryAuditLogRepo inventoryAuditLogRepo;

    @Autowired
    private ProductsRepo productsRepo;

    @Transactional(readOnly = true)
    public Map<String, Object> getAllInventory(int page, int size, String search, UUID categoryId) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "lastUpdated"));

        Specification<Inventory> spec = (root, query, cb) -> cb.conjunction();

        if (search != null && !search.isBlank()) {
            String pattern = "%" + search.toLowerCase() + "%";
            spec = spec.and((root, query, cb) ->
                    cb.like(cb.lower(root.get("product").get("name")), pattern));
        }
        if (categoryId != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("product").get("category").get("categoryId"), categoryId));
        }

        Page<Inventory> inventoryPage = inventoryRepo.findAll(spec, pageable);

        List<InventoryResponseDTO> content = inventoryPage.getContent().stream()
                .map(this::toDTO)
                .toList();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("content", content);
        response.put("totalElements", inventoryPage.getTotalElements());
        response.put("totalPages", inventoryPage.getTotalPages());
        response.put("currentPage", page);
        response.put("pageSize", size);
        return response;
    }

    @Transactional(readOnly = true)
    public InventoryResponseDTO getByProductId(UUID productId) {
        Inventory inventory = inventoryRepo.findByProductProductId(productId)
                .orElseThrow(() -> new NoSuchElementException("Inventory not found for product: " + productId));
        return toDTO(inventory);
    }

    @Transactional
    public InventoryResponseDTO updateStock(UUID productId, InventoryUpdateDTO dto) {
        if (dto.getOperation() == null || dto.getOperation().isBlank()) {
            throw new IllegalArgumentException("operation is required (ADD, DEDUCT, SET)");
        }
        if (dto.getQuantity() == null || dto.getQuantity() < 0) {
            throw new IllegalArgumentException("quantity must be a non-negative integer");
        }

        // Upsert — create inventory record if this product has never had one
        Inventory inventory = inventoryRepo.findByProductProductId(productId).orElseGet(() -> {
            Products product = productsRepo.findById(productId)
                    .orElseThrow(() -> new NoSuchElementException("Product not found: " + productId));
            Inventory newInventory = new Inventory();
            newInventory.setProduct(product);
            newInventory.setQuantity(0);
            newInventory.setLowStockThreshold(10);
            return inventoryRepo.save(newInventory);
        });

        int before = inventory.getQuantity();
        InventoryAuditLog.ChangeType changeType;

        switch (dto.getOperation().toUpperCase()) {
            case "ADD" -> {
                inventory.setQuantity(before + dto.getQuantity());
                changeType = InventoryAuditLog.ChangeType.ADD;
            }
            case "DEDUCT" -> {
                if (before < dto.getQuantity()) {
                    throw new IllegalArgumentException(
                            "Insufficient stock. Available: " + before + ", requested: " + dto.getQuantity());
                }
                inventory.setQuantity(before - dto.getQuantity());
                changeType = InventoryAuditLog.ChangeType.DEDUCT;
            }
            case "SET" -> {
                inventory.setQuantity(dto.getQuantity());
                changeType = InventoryAuditLog.ChangeType.UPDATE;
            }
            default -> throw new IllegalArgumentException(
                    "Invalid operation: " + dto.getOperation() + ". Must be ADD, DEDUCT, or SET");
        }

        if (dto.getLowStockThreshold() != null) {
            inventory.setLowStockThreshold(dto.getLowStockThreshold());
        }

        Inventory saved = inventoryRepo.save(inventory);

        InventoryAuditLog log = new InventoryAuditLog();
        log.setInventory(saved);
        log.setChangeType(changeType);
        log.setQuantityChanged(Math.abs(saved.getQuantity() - before));
        log.setQuantityBefore(before);
        log.setQuantityAfter(saved.getQuantity());
        log.setReason(dto.getReason());
        inventoryAuditLogRepo.save(log);

        return toDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<InventoryResponseDTO> getLowStock() {
        return inventoryRepo.findLowStock().stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getHistory(UUID productId, int page, int size) {
        Inventory inventory = inventoryRepo.findByProductProductId(productId)
                .orElseThrow(() -> new NoSuchElementException("Inventory not found for product: " + productId));

        PageRequest pageable = PageRequest.of(page, size);
        Page<InventoryAuditLog> logPage = inventoryAuditLogRepo
                .findByInventoryOrderByChangedAtDesc(inventory, pageable);

        List<InventoryAuditLogDTO> content = logPage.getContent().stream()
                .map(this::toAuditDTO)
                .toList();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("productId", productId);
        response.put("productName", inventory.getProduct().getName());
        response.put("currentQuantity", inventory.getQuantity());
        response.put("content", content);
        response.put("totalElements", logPage.getTotalElements());
        response.put("totalPages", logPage.getTotalPages());
        response.put("currentPage", page);
        response.put("pageSize", size);
        return response;
    }

    private InventoryResponseDTO toDTO(Inventory inv) {
        return new InventoryResponseDTO(
                inv.getInventoryId(),
                inv.getProduct().getProductId(),
                inv.getProduct().getName(),
                inv.getProduct().getCategory().getName(),
                inv.getQuantity(),
                inv.getLowStockThreshold(),
                inv.getQuantity() <= inv.getLowStockThreshold(),
                inv.getLastUpdated()
        );
    }

    private InventoryAuditLogDTO toAuditDTO(InventoryAuditLog log) {
        return new InventoryAuditLogDTO(
                log.getLogId(),
                log.getChangeType().name(),
                log.getQuantityChanged(),
                log.getQuantityBefore(),
                log.getQuantityAfter(),
                log.getReason(),
                log.getChangedAt()
        );
    }
}
