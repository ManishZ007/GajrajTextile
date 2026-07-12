package com.gajraj.customer.feign;


import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.Map;


@FeignClient("authentication")
public interface ConnectionInterface {

    @GetMapping("/auth/getUserInfo")
    public ResponseEntity<Map<String, Object>> userInfo(
            @RequestHeader("X-User-Id") String user_id
    );

}
