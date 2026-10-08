package com.gajraj.shipping.repo;

import com.gajraj.shipping.model.Shipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ShipmentRepo extends JpaRepository<Shipment, UUID>, JpaSpecificationExecutor<Shipment> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select s from Shipment s where s.id = :id")
    Optional<Shipment> lockById(@org.springframework.data.repository.query.Param("id") UUID id);
    Optional<Shipment> findByOrderId(String orderId);
    Optional<Shipment> findByTrackingNumber(String trackingNumber);
    java.util.List<Shipment> findTop100ByOrderSyncPendingTrueOrderByUpdatedAtAsc();
    boolean existsByOrderId(String orderId);
}
