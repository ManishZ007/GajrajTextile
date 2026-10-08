package com.gajraj.authentication.controller;

import com.gajraj.authentication.service.otp.CustomerOtpService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.Map;

@RestController
@RequestMapping("/auth/customer/otp")
public class CustomerOtpController {
    private final CustomerOtpService otp;
    public CustomerOtpController(CustomerOtpService otp) { this.otp=otp; }
    public record Request(String phone) {}
    public record Verify(String phone, String challengeId, String code) {}
    @PostMapping("/request")
    public ResponseEntity<?> request(@RequestBody Request body, HttpServletRequest request) {
        return ResponseEntity.ok().cacheControl(org.springframework.http.CacheControl.noStore()).body(otp.request(body.phone(), request.getRemoteAddr()));
    }
    @PostMapping("/verify")
    public ResponseEntity<?> verify(@RequestBody Verify body) {
        return ResponseEntity.ok().cacheControl(org.springframework.http.CacheControl.noStore()).body(otp.verify(body.phone(), body.challengeId(), body.code()));
    }
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<?> status(ResponseStatusException e) {
        int status=e.getStatusCode().value();
        String message = switch (status) {
            case 400 -> "Enter a valid Indian mobile number.";
            case 401 -> "Invalid or expired code. Request a new code if needed.";
            case 403 -> "Mobile OTP login is available only for customer accounts. Please use email login.";
            case 404 -> "This number is not registered. Create an account first.";
            case 429 -> "Too many attempts. Wait before trying again.";
            default -> "Mobile login is temporarily unavailable. Please use email login.";
        };
        var response=ResponseEntity.status(e.getStatusCode()).cacheControl(org.springframework.http.CacheControl.noStore());
        if(status==429) response.header("Retry-After", "60");
        return response.body(Map.of("message",message));
    }
    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> unavailable(Exception e) {
        // Never return/log OTPs, phone numbers, Redis values or broker payloads.
        return ResponseEntity.status(503).body(Map.of("message", "Mobile login is temporarily unavailable. Please use email login."));
    }
}
