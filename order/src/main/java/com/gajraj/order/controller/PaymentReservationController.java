package com.gajraj.order.controller;
import com.gajraj.order.service.OrdersService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.util.*;
@RestController
@RequestMapping("/orders/internal/reservation")
public class PaymentReservationController {
    private final OrdersService service;
    private final String token;
    public PaymentReservationController(OrdersService service, @Value("${service.internal-token}") String token) {this.service=service;this.token=token;}
    private void authorize(String value) {
        if(token.isBlank() || !java.security.MessageDigest.isEqual(token.getBytes(java.nio.charset.StandardCharsets.UTF_8), value.getBytes(java.nio.charset.StandardCharsets.UTF_8))) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    }
    @PostMapping("/{id}")
    public Map<String,Object> reserve(@PathVariable UUID id, @RequestParam String userId, @RequestHeader("X-Service-Token") String value) { authorize(value); return service.paymentReservation(id,userId); }
    @PutMapping("/{id}/failed")
    public void failed(@PathVariable UUID id, @RequestHeader("X-Service-Token") String value) {authorize(value);service.paymentFailed(id);}
}
