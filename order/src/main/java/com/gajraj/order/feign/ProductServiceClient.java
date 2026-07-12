package com.gajraj.order.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient("PRODUCT")
public interface ProductServiceClient {

    @PutMapping("/product/variants/decrement-stock/{variantId}")
    ResponseEntity<?> decrementStock(@PathVariable String variantId, @RequestParam int quantity);

    @PutMapping("/product/variants/increment-stock/{variantId}")
    ResponseEntity<?> incrementStock(@PathVariable String variantId, @RequestParam int quantity);
}
