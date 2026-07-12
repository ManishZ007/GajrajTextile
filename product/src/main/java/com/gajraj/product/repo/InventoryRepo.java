package com.gajraj.product.repo;

import com.gajraj.product.model.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InventoryRepo extends JpaRepository<Inventory, UUID>, JpaSpecificationExecutor<Inventory> {
    Optional<Inventory> findByProductProductId(UUID productId);

    @Query("SELECT i FROM Inventory i WHERE i.quantity <= i.lowStockThreshold")
    List<Inventory> findLowStock();
}
