package com.gajraj.product.repo;

import com.gajraj.product.model.Products;
import com.gajraj.product.model.ProductVariants;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface ProductVariantsRepo extends JpaRepository<ProductVariants, UUID>, JpaSpecificationExecutor<ProductVariants> {

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("select v from ProductVariants v where v.variantId = :id")
    Optional<ProductVariants> lockStock(@Param("id") UUID id);

    int countByProduct(Products product);

    @Query("SELECT COALESCE(SUM(v.stockQuantity), 0) FROM ProductVariants v WHERE v.product = :product")
    int sumStockByProduct(@Param("product") Products product);

    void deleteAllByProduct(Products product);

    Optional<ProductVariants> findBySku(String sku);

    Optional<ProductVariants> findBySkuAndVariantIdNot(String sku, UUID variantId);

    long countByStockQuantityEquals(int quantity);

    long countByStockQuantityGreaterThan(int quantity);

    @Query("SELECT COUNT(v) FROM ProductVariants v WHERE v.stockQuantity > 0 AND v.stockQuantity <= 5")
    long countLowStock();

    @Query("SELECT COALESCE(SUM(v.stockQuantity), 0) FROM ProductVariants v")
    long sumAllStock();
}
