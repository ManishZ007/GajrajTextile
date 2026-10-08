package com.gajraj.order.repo;

import com.gajraj.order.model.DealerPayment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DealerPaymentRepo extends JpaRepository<DealerPayment, UUID> {
    List<DealerPayment> findByDealerOrderIdOrderByPaidAtDesc(UUID dealerOrderId);
}
