package com.gajraj.customer.feign;


import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient("products")
public interface ProductConnectionInterface {

    @GetMapping("/product/customer/getProduct")
    public ResponseEntity<String> products(
            @RequestHeader("X-User-Id") String user_id
    );
}
