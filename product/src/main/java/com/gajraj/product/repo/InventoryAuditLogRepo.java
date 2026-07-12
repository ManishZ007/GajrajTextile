package com.gajraj.product.repo;

import com.gajraj.product.model.Inventory;
import com.gajraj.product.model.InventoryAuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface InventoryAuditLogRepo extends JpaRepository<InventoryAuditLog, UUID> {
    Page<InventoryAuditLog> findByInventoryOrderByChangedAtDesc(Inventory inventory, Pageable pageable);
}
