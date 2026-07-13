package com.gajraj.manager.repo;

import com.gajraj.manager.model.ManagerOrderFlow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;
import java.util.UUID;

public interface ManagerOrderFlowRepo extends JpaRepository<ManagerOrderFlow, UUID>, JpaSpecificationExecutor<ManagerOrderFlow> {

    Optional<ManagerOrderFlow> findByOrderId(String orderId);

    long countByProductStstus(ManagerOrderFlow.ProductStatus productStatus);
    long countByQualityCheck(ManagerOrderFlow.QualityCheck qualityCheck);
    long countByShippingStatus(ManagerOrderFlow.ShippingStatus shippingStatus);
}
