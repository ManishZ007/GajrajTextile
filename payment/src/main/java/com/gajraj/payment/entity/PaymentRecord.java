package com.gajraj.payment.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "payment_records")
@Data
public class PaymentRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Version private Long revision;

    private String razorpayOrderId;
    private String razorpayPaymentId;
    private String receipt;
    private Long amount;
    @Column(precision=10, scale=2)
    private java.math.BigDecimal codAmount;
    private String currency;

    private String orderId;
    private String userId;
    private Boolean orderConfirmed = false;
    private LocalDateTime reservationExpiresAt;

    @Enumerated(EnumType.STRING)
    private PaymentStatus status;

    @Column(name = "payment_method")
    private String paymentMethod; // "COD", "UPI", "CARD", "NET_BANKING", "RAZORPAY"

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum PaymentStatus {
        CREATED, INITIATED, PAID, FAILED, COD_PENDING, CANCELLED
    }
}
