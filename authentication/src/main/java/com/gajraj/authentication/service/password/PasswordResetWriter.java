package com.gajraj.authentication.service.password;

import com.gajraj.authentication.repo.UserRepo;
import com.gajraj.authentication.repo.RefreshTokenRepo;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

@Service
public class PasswordResetWriter {
    private final UserRepo users;
    private final RefreshTokenRepo refreshTokens;
    private final PasswordEncoder passwords;
    public PasswordResetWriter(UserRepo users, RefreshTokenRepo refreshTokens, PasswordEncoder passwords) {
        this.users=users; this.refreshTokens=refreshTokens; this.passwords=passwords;
    }
    @Transactional
    public void update(String identity, String password) {
        UUID id=UUID.fromString(identity.split(":",2)[0]);
        var user=users.findForOtpLogin(id).orElse(null);
        if (!CustomerPasswordResetService.eligible(user) || !CustomerPasswordResetService.identity(user).equals(identity))
            throw CustomerPasswordResetService.invalid();
        user.setPasswordHash(passwords.encode(password));
        users.save(user);
        refreshTokens.deleteForPasswordReset(id);
    }
}
