package com.gajraj.order.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "PRODUCT", configuration = ProductStockCredentials.class)
public interface ProductServiceClient {
    @org.springframework.web.bind.annotation.GetMapping("/product/internal/reservations/quote/{variantId}")
    java.util.Map<String,Object> quote(@PathVariable String variantId, @org.springframework.web.bind.annotation.RequestHeader("X-Service-Token") String token);
    @PutMapping("/product/internal/reservations/{id}/cancel")
    void cancel(@PathVariable java.util.UUID id, @org.springframework.web.bind.annotation.RequestHeader("X-Service-Token") String token);

    @org.springframework.web.bind.annotation.PostMapping("/product/internal/reservations/{id}")
    java.util.Map<String,Object> reserve(@PathVariable java.util.UUID id,
            @org.springframework.web.bind.annotation.RequestHeader("X-Service-Token") String token,
            @org.springframework.web.bind.annotation.RequestBody java.util.Map<java.util.UUID,Integer> items);
    @PutMapping("/product/internal/reservations/{id}/commit")
    void commit(@PathVariable java.util.UUID id, @org.springframework.web.bind.annotation.RequestHeader("X-Service-Token") String token);
    @PutMapping("/product/internal/reservations/{id}/release")
    void release(@PathVariable java.util.UUID id, @org.springframework.web.bind.annotation.RequestHeader("X-Service-Token") String token);

    @PutMapping("/product/variants/decrement-stock/{variantId}")
    ResponseEntity<?> decrementStock(@PathVariable String variantId, @RequestParam int quantity);

    @PutMapping("/product/variants/increment-stock/{variantId}")
    ResponseEntity<?> incrementStock(@PathVariable String variantId, @RequestParam int quantity);
}
