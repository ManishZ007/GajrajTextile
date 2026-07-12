package com.gajraj.manager.model;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@ToString
@Table(name = "product_price_update")
public class ProductPriceUpdates {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;


    @Column(name = "product_id")
    private String productId;

    @Column(name = "old_price", columnDefinition = "DECIMAL(10,2)")
    private BigDecimal oldPrice;

    @Column(name = "new_price", columnDefinition = "DECIMAL(10,2)")
    private BigDecimal newPrice;

    @Column(name = "updated_by")
    private String updatedBy;

    @Column(name = "updated_at", columnDefinition = "TIMESTAMP DEFAULT NOW()")
    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @Column(name = "owner_approval")
    private Boolean ownerApproval;

    @OneToOne
    @JoinColumn(name = "owner_report_id", referencedColumnName = "id")
    private OwnerReports ownerReport;

}
