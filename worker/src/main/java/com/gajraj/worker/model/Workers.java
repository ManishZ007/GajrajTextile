package com.gajraj.worker.model;


import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "workers")
@ToString
public class Workers {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "worker_id", columnDefinition = "UUID")
    private UUID workerId;

    @Column(name = "work_experience", nullable = false)
    private int workExperience;

    @Column(name = "worker_code", nullable = false)
    private long workerCode;

    @Column(name = "user_id")
    private String userId;

    @Column(name = "worker_profile_image")
    private String workerProfileImage;

    @Column(name = "gender")
    private String gender;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "created_at", columnDefinition = "TIMESTAMP DEFAULT NOW()")
    @CreationTimestamp
    private LocalDateTime createdAt;


    @Column(name = "updated_at", columnDefinition = "TIMESTAMP DEFAULT NOW()")
    @UpdateTimestamp
    private LocalDateTime updatedAt;

    //connection
    @OneToMany(mappedBy = "workers", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<WorkersAssignment> assignments;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "worker_verification_log")
    private WorkerVerification verification;


}
