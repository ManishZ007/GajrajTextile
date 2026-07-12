package com.gajraj.authentication.model;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name="refresh_token")
@Data
@AllArgsConstructor
@NoArgsConstructor
@ToString
public class RefreshToken {
    @Id
    @GeneratedValue
    @Column(name = "token_id", columnDefinition = "UUID")
    private UUID tokenId;

    @ManyToOne(fetch = FetchType.LAZY) // many tokens can belong to one user
    @JoinColumn(name = "user_id", nullable = false)
    private Users user;

    @Column(name = "refresh_token", nullable = false, unique = true, columnDefinition = "TEXT")
    private String refreshToken;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();
}
