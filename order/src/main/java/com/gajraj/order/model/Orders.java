package com.gajraj.order.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
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
@ToString(exclude = {"items", "customization"})
@Table(name = "orders")
public class Orders {

    @Id
    @GeneratedValue
    @Column(name = "order_id", columnDefinition = "UUID")
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "address_id")
    private String addressId;

    @Column(name = "order_number")
    private String orderNumber;

    @Column(name = "payment_method")
    private String paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(name = "order_status")
    private OrderStatus orderStatus;

    @Column(name = "total_amount", precision = 10, scale = 2)
    private BigDecimal totalAmount;

    // Null means a legacy order, whose stock was deducted during creation.
    @Column(name = "stock_deducted")
    private Boolean stockDeducted = false;

    // NULL identifies legacy orders whose stock was deducted without a reservation.
    @Column(name = "reservation_managed")
    private Boolean reservationManaged = true;

    // Durable synchronization flags; NULL on pre-migration orders avoids replaying history.
    private Boolean integrationPending;
    private Boolean shipmentStarted = false;
    private Boolean codCollected = false;

    // Ready-made dispatch checks; NULL on older records means not checked yet.
    private String readyMadeQuality;
    @Column(length = 1000)
    private String holdReason;
    @Enumerated(EnumType.STRING)
    private OrderStatus statusBeforeHold;

    @Column(name = "handled_by_manager_id")
    private String handledByManagerId;

    @CreationTimestamp
    @Column(name = "order_date")
    private LocalDateTime orderDate;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;


    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<OrderItem> items = new ArrayList<>();

    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL)
    private Customization customization;

    public enum OrderStatus {
        PENDING, CONFIRMED, IN_PROGRESS, ON_HOLD, COMPLETED, CANCELLED, DELIVERED
    }
}
