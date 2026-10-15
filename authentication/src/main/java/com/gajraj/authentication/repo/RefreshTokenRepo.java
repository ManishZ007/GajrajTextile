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

    @Query("select count(r)>0 from RefreshToken r where r.user.user_id=:userId and r.expiresAt>:now")
    boolean hasActiveSession(@Param("userId") UUID userId,@Param("now") Instant now);

    @Modifying @Transactional
    @Query("delete from RefreshToken r where r.refreshToken=:token")
    void revoke(@Param("token") String token);



    @Modifying
    @Query("delete from RefreshToken r where r.user.user_id = :userId")
    void deleteForPasswordReset(@Param("userId") UUID userId);

}
