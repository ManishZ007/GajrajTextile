package com.gajraj.order.repo;

import com.gajraj.order.model.Orders;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;
import java.util.UUID;

public interface OrdersRepo extends JpaRepository<Orders, UUID>, JpaSpecificationExecutor<Orders> {
    org.springframework.data.domain.Page<Orders> findByOrderDateGreaterThanEqualAndOrderDateLessThanOrderByOrderDateDesc(java.time.LocalDateTime start, java.time.LocalDateTime end, org.springframework.data.domain.Pageable pageable);

    java.util.List<Orders> findTop100ByIntegrationPendingTrueOrderByUpdatedAtAsc();

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select o from Orders o where o.id = :id")
    Optional<Orders> findForUpdate(@org.springframework.data.repository.query.Param("id") UUID id);

    Optional<Orders> findByOrderNumber(String orderNumber);

    long countByOrderStatus(Orders.OrderStatus status);

    long countByHandledByManagerId(String managerId);
    long countByHandledByManagerIdAndOrderStatusIn(String managerId, java.util.Collection<Orders.OrderStatus> statuses);
    Page<Orders> findByHandledByManagerIdOrderByOrderDateDesc(String managerId, Pageable pageable);

    Page<Orders> findByUserIdOrderByOrderDateDesc(String userId, Pageable pageable);
}
