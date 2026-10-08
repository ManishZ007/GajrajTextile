package com.gajraj.order.repo;
import com.gajraj.order.model.OrderCheckEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.UUID;
public interface OrderCheckEventRepo extends JpaRepository<OrderCheckEvent, UUID> {
    Page<OrderCheckEvent> findByOrderIdOrderByCreatedAtDesc(UUID orderId, Pageable page);
}
