package com.gajraj.order.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

@Entity @Data @Table(name="customer_reservations")
public class CustomerReservation {
    @Id private UUID id;
    @Version private Long revision;
    @Column(nullable=false) private String userId;
    private String customerName;
    private String email;
    private String phone;
    private String addressId;
    @Column(length=2000) private String address;
    private String type = "IN_STOCK";
    private String status = "REQUESTED";
    private int depositPercent;
    @Column(precision=12,scale=2) private BigDecimal total;
    @Column(precision=12,scale=2) private BigDecimal paid = BigDecimal.ZERO;
    private Instant createdAt = Instant.now();
    private Instant holdExpiresAt;
    private String managerId;
    @Column(length=1000) private String note;
    @Column(length=2000) private String bankInstructions;
    private UUID orderId;
    // Retry cross-service work only after the local payment decision is durable.
    private String stockAction;
    @ElementCollection(fetch=FetchType.EAGER)
    @CollectionTable(name="customer_reservation_items",joinColumns=@JoinColumn(name="reservation_id"))
    private List<Item> items = new ArrayList<>();
    @Embeddable @Data
    public static class Item {
        private String productId;
        private String variantId;
        private String name;
        private String variantLabel;
        private int quantity;
        @Column(precision=12,scale=2) private BigDecimal unitPrice;
    }
}
