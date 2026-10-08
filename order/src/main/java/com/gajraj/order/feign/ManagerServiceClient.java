package com.gajraj.order.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;

@FeignClient(name="MANAGER", configuration=ManagerCredentials.class)
public interface ManagerServiceClient {

    @PostMapping("/internal/order-flow/create")
    ResponseEntity<?> createOrderFlow(@RequestBody Map<String, String> orderFlowRequest);
}
