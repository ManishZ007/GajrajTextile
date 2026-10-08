package com.gajraj.payment.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;

@FeignClient(value = "ORDER", configuration = OrderServiceClient.ServiceAuth.class)
public interface OrderServiceClient {
    class ServiceAuth {
        @org.springframework.context.annotation.Bean
        public feign.RequestInterceptor internalAuth(@org.springframework.beans.factory.annotation.Value("${service.internal-token}") String token) {
            return template -> template.header("X-Service-Token", token);
        }
    }
    @org.springframework.web.bind.annotation.PostMapping("/orders/internal/reservation/{id}")
    java.util.Map<String,Object> reserve(@PathVariable String id,
            @org.springframework.web.bind.annotation.RequestParam String userId,
            @org.springframework.web.bind.annotation.RequestHeader("X-Service-Token") String token);
    @PutMapping("/orders/internal/reservation/{id}/failed")
    void failed(@PathVariable String id, @org.springframework.web.bind.annotation.RequestHeader("X-Service-Token") String token);

    @PutMapping("/orders/internal/payment/confirm/{orderId}")
    ResponseEntity<?> confirmOrder(@PathVariable String orderId);
}
