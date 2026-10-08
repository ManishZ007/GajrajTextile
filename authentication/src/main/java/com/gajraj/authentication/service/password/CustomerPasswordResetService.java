package com.gajraj.authentication.service.password;

import com.gajraj.authentication.model.Users;
import com.gajraj.authentication.notify.PasswordResetNotification;
import com.gajraj.authentication.repo.UserRepo;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.UUID;

@Service
public class CustomerPasswordResetService {
    private final UserRepo users;
    private final PasswordResetStore store;
    private final PasswordResetNotification mail;
    private final PasswordResetWriter writer;
    private final String frontend;
    private final SecureRandom random = new SecureRandom();
    public CustomerPasswordResetService(UserRepo users, PasswordResetStore store,
            PasswordResetNotification mail, PasswordResetWriter writer,
            @Value("${customer.password-reset.frontend-url:http://localhost:3000}") String frontend) {
        this.users=users; this.store=store; this.mail=mail; this.writer=writer;
        URI uri=URI.create(frontend);
        if (uri.getHost()==null || uri.getRawQuery()!=null || uri.getRawFragment()!=null || uri.getUserInfo()!=null
                || !("https".equals(uri.getScheme()) || ("http".equals(uri.getScheme())
                && ("localhost".equals(uri.getHost()) || "127.0.0.1".equals(uri.getHost())))))
            throw new IllegalArgumentException("Configure a trusted customer frontend URL");
        this.frontend=frontend.replaceAll("/+$", "");
    }
    public static String digest(String text) {
        try {
            return Base64.getUrlEncoder().withoutPadding().encodeToString(
                MessageDigest.getInstance("SHA-256").digest(text.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) { throw new IllegalStateException("Reset protection unavailable"); }
    }
    public static boolean eligible(Users user) {
        return user!=null && user.getRole()==Users.Role.CUSTOMER
            && (user.getAuthProvider()==null || user.getAuthProvider()==Users.AuthProvider.LOCAL)
            && user.getPasswordHash()!=null;
    }
    // Bind the link to the current account details: older links stop working after a password/email change.
    public static String identity(Users user) {
        return user.getUser_id() + ":" + digest(user.getEmail() + ":" + user.getPasswordHash());
    }
    public static ResponseStatusException invalid() {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, "This reset link is invalid or expired. Request a new link.");
    }
    private String tokenDigest(String token) {
        if (token==null || !token.matches("[A-Za-z0-9_-]{43}")) throw invalid();
        return digest(token);
    }
    public void request(String email, String client) {
        if (email==null || email.length()>150 || !email.trim().matches("[^\\s@<>]+@[^\\s@<>]+\\.[^\\s@<>]+"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter a valid email address.");
        email=email.trim();
        if (!store.allow(digest(email.toLowerCase(java.util.Locale.ROOT)), digest(client)))
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Please wait before requesting another email.");
        Users user=users.findByEmail(email);
        // Same response for unknown, staff and social-login accounts; never change their credentials.
        if (!eligible(user)) return;
        byte[] bytes=new byte[32]; random.nextBytes(bytes);
        String token=Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        String hash=digest(token);
        store.save(hash,identity(user));
        try { mail.send(user.getEmail(),user.getFullName(),frontend+"/reset-password#token="+token); }
        catch (RuntimeException e) {
            store.delete(hash);
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Unable to send the reset email. Please try again shortly.");
        }
    }
    public void validate(String token) {
        String identity=store.read(tokenDigest(token));
        if (identity==null) throw invalid();
        Users user=users.findById(UUID.fromString(identity.split(":",2)[0])).orElse(null);
        if (!eligible(user) || !identity(user).equals(identity)) throw invalid();
    }
    public void reset(String token, String password) {
        if (password==null || password.length()<8 || password.getBytes(StandardCharsets.UTF_8).length>72 || password.isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Use at least 8 characters and at most 72 UTF-8 bytes.");
        String identity=store.consume(tokenDigest(token));
        if (identity==null) throw invalid();
        writer.update(identity,password);
    }
}
