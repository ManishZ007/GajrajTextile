package com.gajraj.worker.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@ToString
@Table(name = "worker_performance")
public class WorkerPerformance {
    @Id
    @GeneratedValue()
    @Column(name = "id", columnDefinition = "UUID")
    private UUID id;


    @Column(name = "worker_id")
    private String workerId;

    @Column(name = "point_get")
    private int pointGet;

    @Column(name = "penalty_points")
    private int penaltyPoints;

    @Column(name = "evaluated_by")
    private String evaluatedBy;

    @Column(name = "evaluated_at")
    private LocalDateTime evaluatedAt;

//    connection
    @OneToOne(mappedBy = "performance")
    private WorkersAssignment workersAssignment;

}
