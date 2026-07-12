package com.gajraj.worker.model;


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
@Table(name = "worker_progress")
public class WorkerProgress {

    @Id
    @GeneratedValue
    @Column(name = "id", columnDefinition = "UUID")
    private UUID id;

    @Column(name = "assignment_id")
    private String assignmentId;

    @Column(name = "progress_percent")
    private int progressPercent;

    @Column(name = "current_step")
    private Step currentStep;

    @Column(name = "updated_at", columnDefinition = "TIMESTAMP DEFAULT NOW()")
    @UpdateTimestamp
    private LocalDateTime updatedAt = LocalDateTime.now();

    private enum Step {
        PADAR, BUTTI, VINCARI, GONDE, COMPLETED
    }


}
