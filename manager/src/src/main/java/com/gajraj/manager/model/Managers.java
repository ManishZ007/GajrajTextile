package com.gajraj.manager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@ToString
@Table(name = "managers")
public class Managers {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "manager_id")
    private UUID managerId;

    @Column(name = "user_id")
    private String userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "gender")
    private GenderType gender;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;


    @Enumerated(EnumType.STRING)
    @Column(name = "role_type")
    private ManagerType roleType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private ManagerStatus status;


    @Column(name = "created_at", columnDefinition = "TIMESTAMP DEFAULT NOW()")
    @CreationTimestamp
    private LocalDateTime createdAt;


    @Column(name = "updated_at", columnDefinition = "TIMESTAMP DEFAULT NOW()")
    @UpdateTimestamp
    private LocalDateTime updatedAt;


    public enum GenderType {
        MALE, FEMALE, OTHER
    }
    public enum ManagerType {
        PRODUCT_MANAGER, PRODUCTION_MANAGER
    }
    private enum ManagerStatus {
        ACTIVE, INACTIVE
    }
}
