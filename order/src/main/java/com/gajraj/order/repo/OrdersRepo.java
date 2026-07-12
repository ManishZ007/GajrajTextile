package com.gajraj.order.repo;

import com.gajraj.order.model.Orders;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;
import java.util.UUID;

public interface OrdersRepo extends JpaRepository<Orders, UUID>, JpaSpecificationExecutor<Orders> {

    Optional<Orders> findByOrderNumber(String orderNumber);

    long countByOrderStatus(Orders.OrderStatus status);

    Page<Orders> findByUserIdOrderByOrderDateDesc(String userId, Pageable pageable);
}
