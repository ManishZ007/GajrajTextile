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
@Table(name = "manager_order_assignments")
public class ManagerOrderAssignments {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;


    @Column(name = "order_id")
    private String orderId;

    @Column(name = "worker_id")
    private String workerId;

    @Column(name = "manager_id")
    private String managerId;

    @Enumerated(EnumType.STRING)
    @Column(name = "assigning_status")
    private AssigningState assigningStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "task_type")
    private TaskType taskType;

    @Enumerated(EnumType.STRING)
    @Column(name = "state")
    private WorkingState state;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @Column(name = "assigned_at", columnDefinition = "TIMESTAMP DEFAULT NOW()")
    @CreationTimestamp
    private LocalDateTime assignedAt;

    @Column(name = "updated_at", columnDefinition = "TIMESTAMP DEFAULT NOW()")
    @CreationTimestamp
    private LocalDateTime updatedAt;



    public enum AssigningState {
        NOT_ASSIGN, ASSIGN, REASSIGN
    }

    public  enum TaskType {
        PADAR, KINAR, VINKARI
    }

    public enum WorkingState {
        ASSIGNED, HOLD, CANCELED
    }
}
