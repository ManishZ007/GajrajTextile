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
import java.util.UUID;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@ToString
@Table(name = "orders")
public class Orders {

    @Id
    @GeneratedValue
    @Column(name="order_id", columnDefinition = "UUID")
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "product_id")
    private String productId;

    @Column(name = "order_number")
    private String orderNumber;

    @Column(name = "variant_id")
    private String variantId;

    @Column(name = "address_id")
    private String addressId;

    @Column(name = "order_type")
    private String orderType;

    @Enumerated(EnumType.STRING)
    @Column(name = "order_status")
    private OrderStatus orderStatus;

    @Column(name = "total_amount", precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "payment_method")
    private String paymentMethod;

    @CreationTimestamp
    @Column(name = "order_date")
    private LocalDateTime orderDate;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL)
    private Customization customization;


    public enum OrderStatus {
        PENDING, CONFIRMED, IN_PROGRESS, ON_HOLD, COMPLETED, CANCELLED, DELIVERED
    }
}
