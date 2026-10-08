package com.gajraj.order.repo;

import com.gajraj.order.model.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface OrderItemRepo extends JpaRepository<OrderItem, UUID> {

    List<OrderItem> findByOrderId(UUID orderId);
}
