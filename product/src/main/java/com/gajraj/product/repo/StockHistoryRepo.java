package com.gajraj.product.repo;

import com.gajraj.product.model.StockHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.UUID;

public interface StockHistoryRepo extends JpaRepository<StockHistory, UUID>, JpaSpecificationExecutor<StockHistory> {
    List<StockHistory> findByVariantVariantIdOrderByCreatedAtDesc(UUID variantId);
    Page<StockHistory> findByVariantVariantIdOrderByCreatedAtDesc(UUID variantId, Pageable pageable);
    Page<StockHistory> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
