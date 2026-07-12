package com.gajraj.worker.model;


import com.fasterxml.jackson.annotation.JsonIgnore;
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
@Table(name = "worker_assignment")
public class WorkersAssignment {

    @Id
    @GeneratedValue
    @Column(name = "id", columnDefinition = "UUID")
    private UUID id;

    @Column(name = "order_id")
    private long orderId;

    @Column(name = "assigned_by")
    private UUID assignedBy;

    @Column(name = "assigned_date")
    private LocalDateTime assignedDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private Status status;


    private enum Status {
        ASSIGNED, IN_PROGRESS, COMPLETED, HOLD
    }

    @Column(name = "created_at", columnDefinition = "TIMESTAMP DEFAULT NOW()")
    @CreationTimestamp
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", columnDefinition = "TIMESTAMP DEFAULT NOW()")
    @UpdateTimestamp
    private LocalDateTime updatedAt = LocalDateTime.now();

    // connection to worker
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "worker_id")
    private Workers workers;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "worker_progress_id")
    @JsonIgnore
    private WorkerProgress progress;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "worker_performance_id")
    private WorkerPerformance performance;


    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "material_usage")
    private MaterialUsageForOrder materialUsage;


}
