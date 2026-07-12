package com.gajraj.payment.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;

@FeignClient("ORDER")
public interface OrderServiceClient {

    @PutMapping("/internal/payment/confirm/{orderId}")
    ResponseEntity<?> confirmOrder(@PathVariable String orderId);
}
