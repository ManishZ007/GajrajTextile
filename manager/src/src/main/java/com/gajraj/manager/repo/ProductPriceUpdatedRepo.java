package com.gajraj.manager.repo;

import com.gajraj.manager.model.ProductPriceUpdates;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.UUID;

public interface ProductPriceUpdatedRepo extends JpaRepository<ProductPriceUpdates, UUID>, JpaSpecificationExecutor<ProductPriceUpdates> {

    long countByOwnerApprovalIsNull();
    long countByOwnerApprovalTrue();
    long countByOwnerApprovalFalse();
    List<ProductPriceUpdates> findByProductId(String productId);
}
