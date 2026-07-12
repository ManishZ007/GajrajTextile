package com.gajraj.payment.repository;

import com.gajraj.payment.entity.PaymentRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentRepository extends JpaRepository<PaymentRecord, Long> {
    Optional<PaymentRecord> findByRazorpayOrderId(String razorpayOrderId);
    Optional<PaymentRecord> findByOrderId(String orderId);
}
