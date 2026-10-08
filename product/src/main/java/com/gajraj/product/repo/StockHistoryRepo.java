package com.gajraj.product.repo;

import com.gajraj.product.model.ProductVariants;
import com.gajraj.product.model.StockHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface StockHistoryRepo extends JpaRepository<StockHistory, UUID>, JpaSpecificationExecutor<StockHistory> {
    List<StockHistory> findByVariantVariantIdOrderByCreatedAtDesc(UUID variantId);
    Page<StockHistory> findByVariantVariantIdOrderByCreatedAtDesc(UUID variantId, Pageable pageable);
    Page<StockHistory> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Modifying
    @Query("DELETE FROM StockHistory sh WHERE sh.variant IN :variants")
    void deleteByVariantIn(@Param("variants") Collection<ProductVariants> variants);
}
