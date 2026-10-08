package com.gajraj.order.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@FeignClient("PAYMENT")
public interface PaymentServiceClient {
    @PostMapping("/payment/manager/orders/summaries")
    java.util.Map<String,PaymentSummary> summaries(@RequestHeader("Authorization") String authorization, @RequestBody java.util.List<java.util.UUID> ids);
    record PaymentSummary(String status, String paymentMethod, java.math.BigDecimal amount, String currency) {}
    @PutMapping("/payment/internal/cod/{id}")
    void sync(@PathVariable String id, @RequestHeader("X-Service-Token") String token, @RequestBody Map<String,Object> data);
}
