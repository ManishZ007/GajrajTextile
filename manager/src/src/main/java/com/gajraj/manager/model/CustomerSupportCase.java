package com.gajraj.manager.model;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@ToString
@Table(name = "customer_support_case")
public class CustomerSupportCase {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "order_id")
    private String orderId;

    @Column(name = "customer_id")
    private String customerId;

    @Column(name = "issue_type", columnDefinition = "TEXT")
    private String issueType;

    @Column(name = "description", columnDefinition = "TEXT")
    private  String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private CaseStatus status;

    @Column(name = "handled_by")
    private String handledBy;

    @Column(name = "created_at", columnDefinition = "TIMESTAMP DEFAULT NOW()")
    @CreationTimestamp
    private LocalDateTime createdAt;


    @Column(name = "updated_at", columnDefinition = "TIMESTAMP DEFAULT NOW()")
    @UpdateTimestamp
    private LocalDateTime updatedAt;


    @Column(name = "resolution_note", columnDefinition = "TEXT")
    private String resolutionNote;


    public enum CaseStatus {
        OPEN, IN_PROGRESS, RESOLVED
    }

}
