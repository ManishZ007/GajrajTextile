package com.gajraj.authentication.service.jwtService;

import com.gajraj.authentication.model.RefreshToken;
import com.gajraj.authentication.model.Users;
import com.gajraj.authentication.repo.RefreshTokenRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;


@Service
public class RefreshTokenService {

    @Autowired
    private RefreshTokenRepo refreshTokenRepo;


    private String generateSecureToken() {
        byte[] randomBytes = new byte[64];
        new SecureRandom().nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }


    public RefreshToken createRefreshToken (Users userId) {

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(userId);
        refreshToken.setRefreshToken(generateSecureToken());
        refreshToken.setCreatedAt(Instant.now());
        refreshToken.setExpiresAt(Instant.now().plusSeconds(60L * 60L * 24L * 10L));

        return refreshTokenRepo.save(refreshToken);

    }


    public String updateRefreshToken (UUID userId) {

        String newToken = generateSecureToken();
        Instant now = Instant.now();
        Instant expiry = now.plusSeconds(60L * 60L * 24L * 10L); // 10 days

        int updated = refreshTokenRepo.updateRefreshTokenByUserId(
                userId,
                newToken,
                expiry,
                now
        );
        return newToken;
    }

    public boolean verifyExpiration(RefreshToken token) {

        if (token.getExpiresAt().isBefore(Instant.now())) {
            refreshTokenRepo.delete(token);

            return false;
        }
        return true;

    }


    public RefreshToken getByToken (String token) {
        return refreshTokenRepo.findByRefreshToken(token).orElse(null);
    }


}
