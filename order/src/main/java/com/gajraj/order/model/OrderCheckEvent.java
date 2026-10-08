package com.gajraj.order.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Data
@Table(name = "order_check_events", indexes = @Index(name = "idx_check_order", columnList = "order_id"))
public class OrderCheckEvent {
    @Id @GeneratedValue private UUID id;
    @Column(name = "order_id", nullable = false) private UUID orderId;
    @Column(nullable = false) private String action;
    @Column(length = 1000) private String note;
    @Column(nullable = false) private String actor;
    @Column(nullable = false) private LocalDateTime createdAt;
}
