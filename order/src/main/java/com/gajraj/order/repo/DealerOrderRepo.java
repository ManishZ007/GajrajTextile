package com.gajraj.order.repo;

import com.gajraj.order.model.DealerOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface DealerOrderRepo extends JpaRepository<DealerOrder, UUID> {
    org.springframework.data.domain.Page<DealerOrder> findByCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(java.time.LocalDateTime start, java.time.LocalDateTime end, org.springframework.data.domain.Pageable pageable);

    Page<DealerOrder> findByDealerIdOrderByCreatedAtDesc(UUID dealerId, Pageable pageable);
    Page<DealerOrder> findByCreatedByManagerIdOrderByCreatedAtDesc(String managerId, Pageable pageable);
    Page<DealerOrder> findByStatusOrderByCreatedAtDesc(DealerOrder.DealerOrderStatus status, Pageable pageable);
    Optional<DealerOrder> findByOrderNumber(String orderNumber);
    long countByStatus(DealerOrder.DealerOrderStatus status);
    long countByCreatedByManagerId(String managerId);
    long countByCreatedByManagerIdAndStatus(String managerId, DealerOrder.DealerOrderStatus status);
}
