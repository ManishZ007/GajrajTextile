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
@Table(name = "worker_verification")
public class WorkerVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "worker_id")
    private String workerId;

    @Column(name = "old_status")
    private VerificationStatus oldStatus;


    @Column(name = "new_status")
    private VerificationStatus newStatus;

    @Column(name = "change_by")
    private String changeBy;

    @Column(name = "change_at")
    private LocalDateTime change_at;

    @Column(name = "reason")
    private String reason;



    public enum VerificationStatus {
        PENDING, APPROVED, REJECTED
    }



}
