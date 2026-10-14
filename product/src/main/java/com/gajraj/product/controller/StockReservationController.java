package com.gajraj.product.controller;
import com.gajraj.product.service.StockReservationService;
import com.gajraj.product.model.StockReservation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.util.*;
@RestController
@RequestMapping("/product/internal/reservations")
public class StockReservationController {
    private final StockReservationService service;
    private final String token;
    public StockReservationController(StockReservationService service, @Value("${service.internal-token}") String token) { this.service=service; this.token=token; }
    private void authorize(String supplied) {
        if (token.isBlank() || !java.security.MessageDigest.isEqual(token.getBytes(java.nio.charset.StandardCharsets.UTF_8), supplied.getBytes(java.nio.charset.StandardCharsets.UTF_8)))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    }
    @PostMapping("/{id}")
    public StockReservation reserve(@PathVariable UUID id, @RequestHeader("X-Service-Token") String supplied, @RequestBody Map<UUID,Integer> items) { authorize(supplied); return service.reserve(id, items); }
    @PutMapping("/{id}/commit")
    public void commit(@PathVariable UUID id, @RequestHeader("X-Service-Token") String supplied) { authorize(supplied); service.commit(id); }
    @PostMapping("/{id}/customer-hold")
    public StockReservation customerHold(@PathVariable UUID id, @RequestHeader("X-Service-Token") String supplied, @RequestBody Map<UUID,Integer> items) { authorize(supplied); return service.reserveCustomer(id, items); }
    @PutMapping("/{id}/review")
    public void review(@PathVariable UUID id, @RequestHeader("X-Service-Token") String supplied, @RequestParam boolean pending) { authorize(supplied); service.review(id, pending); }
    @PutMapping("/{id}/release")
    public void release(@PathVariable UUID id, @RequestHeader("X-Service-Token") String supplied) { authorize(supplied); service.release(id, false); }
    @PutMapping("/{id}/cancel")
    public void cancel(@PathVariable UUID id, @RequestHeader("X-Service-Token") String supplied) { authorize(supplied); service.cancel(id); }
    @GetMapping("/quote/{variantId}")
    public Map<String,Object> quote(@PathVariable UUID variantId, @RequestHeader("X-Service-Token") String supplied) { authorize(supplied); return service.quote(variantId); }
    @GetMapping("/remake-quote/{variantId}")
    public Map<String,Object> remakeQuote(@PathVariable UUID variantId,@RequestHeader("X-Service-Token") String supplied) { authorize(supplied);return service.remakeQuote(variantId); }
}
