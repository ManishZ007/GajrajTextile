package com.gajraj.authentication.model;


import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;


@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "users", uniqueConstraints = {
        @UniqueConstraint(name = "uk_users_provider_identity", columnNames = {"auth_provider", "provider_user_id"})
})
@ToString
public class Users {

    @Id
    @GeneratedValue
    @Column(name="user_id", columnDefinition = "UUID")
    private UUID user_id;


    @NotBlank
    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;


    @Email
    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Pattern(regexp="^[0-9]{10}$")
    @Column(name = "phone_number", unique = true, length = 20)
    private String phoneNumber;

    @Column(name = "password_hash", columnDefinition = "TEXT")
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(name = "auth_provider", nullable = false, length = 20, columnDefinition = "VARCHAR(20) DEFAULT 'LOCAL'")
    private AuthProvider authProvider = AuthProvider.LOCAL;

    @Column(name = "provider_user_id", length = 100)
    private String providerUserId;

    @Column(name = "email_verified", nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    private boolean emailVerified = false;

    @Column(name = "created_at", columnDefinition = "TIMESTAMP DEFAULT NOW()")
    @CreationTimestamp
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", columnDefinition = "TIMESTAMP DEFAULT NOW()")
    @UpdateTimestamp
    private LocalDateTime updatedAt = LocalDateTime.now();

    @ToString.Exclude
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RefreshToken> refreshTokens ;

    // ---- Enum for Role ---
    public enum Role {
        CUSTOMER, WORKER, MANAGER, OWNER
    }

    // ---- Enum for Auth Provider ---
    public enum AuthProvider {
        LOCAL, GOOGLE, FACEBOOK
    }

}
