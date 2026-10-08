package com.gajraj.manager.repo;

import com.gajraj.manager.model.ProductPriceUpdates;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.UUID;

public interface ProductPriceUpdatedRepo extends JpaRepository<ProductPriceUpdates, UUID>, JpaSpecificationExecutor<ProductPriceUpdates> {

    java.util.Optional<ProductPriceUpdates> findByOwnerReport_Id(UUID id);
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select p from ProductPriceUpdates p where p.id = :id")
    java.util.Optional<ProductPriceUpdates> lockForApproval(@org.springframework.data.repository.query.Param("id") UUID id);
    long countByOwnerApprovalIsNull();
    long countByOwnerApprovalTrue();
    long countByOwnerApprovalFalse();
    List<ProductPriceUpdates> findByProductId(String productId);
}
