package com.gajraj.payment.controller;
import com.gajraj.payment.service.CodPaymentService;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.math.BigDecimal;
@RestController
@RequestMapping("/payment/internal/cod")
public class CodPaymentController {
    private final CodPaymentService service;
    private final String token;
    public CodPaymentController(CodPaymentService service, @Value("${service.internal-token}") String token) {this.service=service;this.token=token;}
    public record Update(BigDecimal amount, String userId, String status) {}
    @PutMapping("/{id}")
    public void sync(@PathVariable java.util.UUID id, @RequestHeader("X-Service-Token") String supplied, @RequestBody Update data) {
        if (token.isBlank() || !java.security.MessageDigest.isEqual(token.getBytes(java.nio.charset.StandardCharsets.UTF_8), supplied.getBytes(java.nio.charset.StandardCharsets.UTF_8)))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        service.sync(id.toString(),data.amount(),data.userId(),data.status());
    }
}
