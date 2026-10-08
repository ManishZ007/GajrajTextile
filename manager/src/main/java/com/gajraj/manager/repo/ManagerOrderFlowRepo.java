package com.gajraj.manager.repo;

import com.gajraj.manager.model.ManagerOrderFlow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;
import java.util.UUID;

public interface ManagerOrderFlowRepo extends JpaRepository<ManagerOrderFlow, UUID>, JpaSpecificationExecutor<ManagerOrderFlow> {

    java.util.List<ManagerOrderFlow> findAllByOrderIdOrderByUpdatedAtAscIdAsc(String orderId);

    // Older releases could create duplicate initial rows on integration retries.
    // Keep the original worked-on flow, never replace it with a newer empty retry.
    default Optional<ManagerOrderFlow> findByOrderId(String orderId) {
        var flows = findAllByOrderIdOrderByUpdatedAtAscIdAsc(orderId);
        var progressed = flows.stream().filter(flow ->
                (flow.getProductStstus() != null && flow.getProductStstus() != ManagerOrderFlow.ProductStatus.NOT_STARTED)
                || (flow.getQualityCheck() != null && flow.getQualityCheck() != ManagerOrderFlow.QualityCheck.PENDING)
                || (flow.getShippingStatus() != null && flow.getShippingStatus() != ManagerOrderFlow.ShippingStatus.NOT_READY)
                || flow.getHandledBy() != null || flow.getNote() != null).findFirst();
        return progressed.isPresent() ? progressed : flows.stream().findFirst();
    }

    long countByProductStstus(ManagerOrderFlow.ProductStatus productStatus);
    long countByQualityCheck(ManagerOrderFlow.QualityCheck qualityCheck);
    long countByShippingStatus(ManagerOrderFlow.ShippingStatus shippingStatus);
}
