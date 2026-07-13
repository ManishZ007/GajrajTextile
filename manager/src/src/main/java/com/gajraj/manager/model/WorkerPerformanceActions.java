package com.gajraj.manager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.hibernate.annotations.UpdateTimestamp;


import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@ToString
@Table(name = "worker_performance_actions")
public class WorkerPerformanceActions {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;


    @Column(name = "worker_id")
    private String workerId;

    @Enumerated(EnumType.STRING)
    @Column(name = "action_type")
    private ActionType actionType;


    @Enumerated(EnumType.STRING)
    @Column(name = "action_status")
    private ActionStatus actionStatus;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @Column(name = "decided_by")
    private String decidedBy;



    @Column(name = "created_at", columnDefinition = "TIMESTAMP DEFAULT NOW()")
    @UpdateTimestamp
    private LocalDateTime createdAt;

    public enum ActionStatus {
        OPEN, RESOLVE
    }

    public enum ActionType {
        WARNING, REMOVE, REPORT_TO_OWNER, WELL
    }

}
