package com.gajraj.authentication.repo;


import com.gajraj.authentication.model.RefreshToken;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RefreshTokenRepo extends JpaRepository<RefreshToken, UUID> {

    Optional<RefreshToken> findByRefreshToken(String token);

    @Query("""
            SELECT r FROM RefreshToken r WHERE r.user.user_id = :user_id
            """)
    RefreshToken findByUserId(@Param("user_id") UUID user_id);



    @Modifying
    @Transactional
    @Query("""
    UPDATE RefreshToken r
    SET 
        r.refreshToken = :refreshToken,
        r.expiresAt = :expiresAt,
        r.createdAt = :createdAt
    WHERE r.user.user_id = :userId
""")
    int updateRefreshTokenByUserId(
            @Param("userId") UUID userId,
            @Param("refreshToken") String refreshToken,
            @Param("expiresAt") Instant expiresAt,
            @Param("createdAt") Instant createdAt
    );

}
