package com.gajraj.authentication.service.otp;

import com.gajraj.authentication.model.Users;
import com.gajraj.authentication.repo.UserRepo;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Service
public class CustomerOtpService {
    private final UserRepo users;
    private final OtpStore store;
    private final OtpCrypto crypto;
    private final OtpPublisher publisher;
    private final CustomerOtpTokens tokens;
    private final boolean enabled;
    public CustomerOtpService(UserRepo users, OtpStore store, OtpCrypto crypto, OtpPublisher publisher,
                              CustomerOtpTokens tokens, @Value("${customer.otp.enabled:false}") boolean enabled) {
        this.users=users; this.store=store; this.crypto=crypto; this.publisher=publisher; this.tokens=tokens; this.enabled=enabled;
    }
    public static String normalizePhone(String input) {
        if (input == null || input.length() > 24) throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        String phone = input.replaceAll("[\\s()-]", "");
        if (phone.startsWith("+91")) phone = phone.substring(3);
        if (!phone.matches("[6-9][0-9]{9}")) throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        return phone;
    }
    private void checkEnabled() {
        if (!enabled) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE);
        crypto.checkConfiguration();
    }
    public Map<String, Object> request(String input, String client) {
        checkEnabled();
        String phone = normalizePhone(input);
        Users user = users.findByPhoneNumber(phone);
        boolean eligible = user != null && user.getRole() == Users.Role.CUSTOMER;
        String id = UUID.randomUUID().toString(), code = crypto.code();
        Instant expiresAt = Instant.now().plusSeconds(300);
        String phoneKey = crypto.digest("phone:"+phone);
        if (!store.create(phoneKey, crypto.digest("client:"+client), id, crypto.digest(id+":"+phone+":"+code),
                eligible ? user.getUser_id().toString() : ""))
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS);
        if (!eligible) {
            // Preserve request limits, but never leave a usable challenge for an ineligible account.
            store.invalidate(phoneKey, id);
            throw new ResponseStatusException(user == null ? HttpStatus.NOT_FOUND : HttpStatus.FORBIDDEN);
        }
        try { publisher.publish(id, phone, code, expiresAt); }
        catch (RuntimeException e) {
            store.invalidate(phoneKey, id);
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE);
        }
        return Map.of("challengeId", id, "expiresIn", 300, "retryAfter", 60,
                "message", "A login code has been requested for your registered mobile number.");
    }
    public Object verify(String input, String id, String code) {
        checkEnabled();
        String phone = normalizePhone(input);
        if (id == null || !id.matches("[0-9a-fA-F-]{36}") || code == null || !code.matches("[0-9]{6}"))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        String userId = store.consume(crypto.digest("phone:"+phone), id, crypto.digest(id+":"+phone+":"+code));
        if (userId == null || userId.isBlank()) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        return tokens.issue(userId, phone);
    }
}
