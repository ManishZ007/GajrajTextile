package com.gajraj.manager.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.Map;

@FeignClient("ORDER")
public interface OrderServiceClient {

    @GetMapping("/internal/manager-stats/{managerId}")
    ResponseEntity<Map<String, Object>> getManagerStats(@PathVariable("managerId") String managerId, @org.springframework.web.bind.annotation.RequestHeader("Authorization") String authorization);
}
