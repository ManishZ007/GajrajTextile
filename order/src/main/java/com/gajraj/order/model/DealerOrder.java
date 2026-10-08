package com.gajraj.order.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "dealer_orders")
public class DealerOrder {

    @Id
    @GeneratedValue
    @Column(name = "dealer_order_id", columnDefinition = "UUID")
    private UUID id;

    @Column(name = "order_number", unique = true)
    private String orderNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dealer_id", nullable = false)
    private Dealer dealer;

    @Column(name = "created_by_manager_id", nullable = false)
    private String createdByManagerId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private DealerOrderStatus status = DealerOrderStatus.DRAFT;

    @Column(name = "total_amount", precision = 10, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "paid_amount", precision = 10, scale = 2)
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "dealerOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DealerOrderItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "dealerOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DealerPayment> payments = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum DealerOrderStatus {
        DRAFT, CONFIRMED, IN_PRODUCTION, READY, DELIVERED, CANCELLED
    }
}
