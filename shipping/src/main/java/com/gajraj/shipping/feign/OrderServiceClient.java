package com.gajraj.shipping.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient("ORDER")
public interface OrderServiceClient {

    @GetMapping("/internal/orders/{orderId}/exists")
    ResponseEntity<Boolean> orderExists(@PathVariable String orderId);

    @PutMapping("/internal/orders/{orderId}/shipping-status")
    ResponseEntity<?> updateOrderShippingStatus(
            @PathVariable String orderId,
            @RequestParam String status
    );
}
