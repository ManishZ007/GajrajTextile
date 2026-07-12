package com.gajraj.manager.model;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@ToString
@Table(name = "manager_order_flow")
public class ManagerOrderFlow {


    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "order_id")
    private String orderId;

    @Enumerated(EnumType.STRING)
    @Column(name = "product_status")
    private ProductStatus productStstus;

    @Enumerated(EnumType.STRING)
    @Column(name = "quality_check")
    private QualityCheck qualityCheck;

    @Enumerated(EnumType.STRING)
    @Column(name = "shipping_status")
    private ShippingStatus shippingStatus;


    @Column(name = "address_id")
    private String addressId;

    @Column(name = "handled_by")
    private  String handledBy;

    @Column(name = "updated_at", columnDefinition = "TIMESTAMP DEFAULT NOW()")
    @CreationTimestamp
    private LocalDateTime updatedAt;

    @Column(name="note", columnDefinition = "TEXT")
    private String note;


    public enum ProductStatus {
        NOT_STARTED, IN_PROGRESS, COMPLETED
    }

    public enum QualityCheck {
        PENDING, APPROVED, REJECTED
    }

    public enum ShippingStatus {
        NOT_READY, READY_FOR_SHIPPING, SHIPPED
    }



}
