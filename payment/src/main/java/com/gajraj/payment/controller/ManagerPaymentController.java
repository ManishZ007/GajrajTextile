package com.gajraj.payment.controller;

import com.gajraj.payment.repository.PaymentRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/payment/manager/orders")
public class ManagerPaymentController {
    private final PaymentRepository repository;
    public ManagerPaymentController(PaymentRepository repository) { this.repository = repository; }

    public record Summary(String status, String paymentMethod, BigDecimal amount, String currency,
                          String paymentId, LocalDateTime updatedAt) {}

    @GetMapping("/{orderId}")
    public ResponseEntity<Summary> summary(@PathVariable String orderId) {
        return repository.findFirstByOrderIdOrderByIdDesc(orderId).map(record -> {
            BigDecimal amount = "COD".equals(record.getPaymentMethod()) && record.getCodAmount() != null
                    ? record.getCodAmount() : record.getAmount() == null ? null : BigDecimal.valueOf(record.getAmount());
            return ResponseEntity.ok(new Summary(record.getStatus() == null ? null : record.getStatus().name(),
                    record.getPaymentMethod(), amount, record.getCurrency(), record.getRazorpayPaymentId(), record.getUpdatedAt()));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/summaries")
    public java.util.Map<String,Summary> summaries(@RequestBody java.util.List<java.util.UUID> ids) {
        if (ids.size()>500) throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST);
        var result=new java.util.HashMap<String,Summary>();
        for (var id:ids) {
            var response=summary(id.toString());
            if (response.getBody()!=null) result.put(id.toString(),response.getBody());
        }
        return result;
    }
}
