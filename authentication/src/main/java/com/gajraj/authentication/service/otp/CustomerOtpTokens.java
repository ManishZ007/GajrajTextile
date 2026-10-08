package com.gajraj.authentication.service.otp;

import com.gajraj.authentication.dto.auth.login.LoginResponseDTO;
import com.gajraj.authentication.model.Users;
import com.gajraj.authentication.repo.UserRepo;
import com.gajraj.authentication.service.AuthService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.util.UUID;

@Service
public class CustomerOtpTokens {
    private final UserRepo users;
    private final AuthService auth;
    public CustomerOtpTokens(UserRepo users, AuthService auth) { this.users = users; this.auth = auth; }
    @Transactional
    public LoginResponseDTO issue(String userId, String phone) {
        Users user = users.findForOtpLogin(UUID.fromString(userId)).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        // Recheck after OTP consumption: roles and phone numbers may have changed.
        if (user.getRole() != Users.Role.CUSTOMER || !phone.equals(user.getPhoneNumber()))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        return auth.issueLoginTokens(user);
    }
}
