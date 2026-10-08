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
@ToString(exclude = "order")
@Table(name = "order_items")
public class OrderItem {

    @Id
    @GeneratedValue
    @Column(name = "order_item_id", columnDefinition = "UUID")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Orders order;

    @Column(name = "product_id")
    private String productId;

    @Column(name = "variant_id")
    private String variantId;

    @Column(name = "quantity")
    private int quantity;

    @Column(name = "subtotal", precision = 10, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "order_type")
    private String orderType;

    @Enumerated(EnumType.STRING)
    @Column(name = "current_status")
    private ItemStatus currentStatus;

    @Column(name = "tracking_number")
    private String trackingNumber;

    @Column(name = "courier_service")
    private String courierService;

    @Column(name = "estimated_delivery")
    private String estimatedDelivery;

    @Column(name = "worker_id")
    private String workerId;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public enum ItemStatus {
        PENDING, IN_PRODUCTION, COMPLETED, SHIPPED, DELIVERED, CANCELLED
    }
}
