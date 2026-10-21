package com.gajraj.product.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.Instant;
import java.math.BigDecimal;
import java.util.UUID;

@Entity @Data @Table(name="custom_design_requests")
public class CustomDesignRequest {
    @Id private UUID id;
    @Version private Long version;
    @Column(nullable=false) private String userId;
    @Column(nullable=false) private UUID productId;
    @Column(nullable=false) private String productName;
    @Column(nullable=false) private String contactName;
    @Column(nullable=false) private String phone;
    @Column(length=2000) private String notes;
    @Column(nullable=false,columnDefinition="TEXT") private String snapshot;
    @Column(nullable=false) private String submissionHash;
    @Column(nullable=false) private String status="SUBMITTED";
    @Column(precision=12,scale=2) private BigDecimal quoteAmount;
    @Column(length=2000) private String quoteNotes;
    private String quotedBy;
    private Instant quotedAt;
    @Column(nullable=false) private Instant createdAt=Instant.now();
}
