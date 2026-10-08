package com.gajraj.order.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "dealer_payments")
public class DealerPayment {

    @Id
    @GeneratedValue
    @Column(name = "payment_id", columnDefinition = "UUID")
    private UUID id;

    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dealer_order_id", nullable = false)
    private DealerOrder dealerOrder;

    @Column(name = "amount", precision = 10, scale = 2, nullable = false)
    private BigDecimal amount;

    @Column(name = "payment_mode")
    private String paymentMode;

    @Column(name = "reference_number")
    private String referenceNumber;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @Column(name = "recorded_by_manager_id", nullable = false)
    private String recordedByManagerId;

    @CreationTimestamp
    @Column(name = "paid_at")
    private LocalDateTime paidAt;
}
