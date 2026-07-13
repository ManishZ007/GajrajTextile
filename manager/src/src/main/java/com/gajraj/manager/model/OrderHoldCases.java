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
@Table(name = "order_hold_cases")
public class OrderHoldCases {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "order_id")
    private String orderId;

    @Column(name = "worker_id")
    private  String workerId;

    @Column(name = "hold_reason", columnDefinition = "TEXT")
    private String holdReason;

    @Column(name = "reported_at", columnDefinition = "TIMESTAMP DEFAULT NOW()")
    @CreationTimestamp
    private LocalDateTime reportedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private CaseStatus status;

    @Column(name = "handled_by")
    private String handledBy;

    @Column(name = "new_worker_id")
    private String NewWorkerId;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    public enum CaseStatus {
        OPEN, RESOLVED
    }

}
