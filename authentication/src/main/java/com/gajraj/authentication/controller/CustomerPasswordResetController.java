package com.gajraj.authentication.controller;

import com.gajraj.authentication.service.password.CustomerPasswordResetService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.Map;

@RestController
@RequestMapping("/auth/customer/password-reset")
public class CustomerPasswordResetController {
    private final CustomerPasswordResetService service;
    public CustomerPasswordResetController(CustomerPasswordResetService service) { this.service=service; }
    public record Request(String email) {}
    public record Validate(String token) {}
    public record Reset(String token, String password) {}
    private ResponseEntity<?> ok(String message) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(Map.of("message",message));
    }
    @PostMapping("/request")
    public ResponseEntity<?> request(@RequestBody Request body, HttpServletRequest request) {
        service.request(body.email(),request.getRemoteAddr());
        return ok("If this email belongs to a customer account with a password, a reset link has been requested. For Google or Facebook accounts, use that sign-in option.");
    }
    @PostMapping("/validate")
    public ResponseEntity<?> validate(@RequestBody Validate body) {
        service.validate(body.token()); return ok("Link verified. Choose a new password.");
    }
    @PostMapping("/reset")
    public ResponseEntity<?> reset(@RequestBody Reset body) {
        service.reset(body.token(),body.password()); return ok("Password updated. Sign in with your new password.");
    }
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<?> status(ResponseStatusException e) {
        var response=ResponseEntity.status(e.getStatusCode()).cacheControl(CacheControl.noStore());
        if (e.getStatusCode().value()==429) response.header("Retry-After","60");
        return response.body(Map.of("message",e.getReason()==null ? "Unable to reset password." : e.getReason()));
    }
    @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
    public ResponseEntity<?> badRequest(Exception e) {
        return ResponseEntity.badRequest().cacheControl(CacheControl.noStore()).body(Map.of("message","Invalid request."));
    }
    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> unavailable(Exception e) {
        return ResponseEntity.status(503).cacheControl(CacheControl.noStore())
            .body(Map.of("message","Password reset is temporarily unavailable. Please request a new link shortly."));
    }
}
