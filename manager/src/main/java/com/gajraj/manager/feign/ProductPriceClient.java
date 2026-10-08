package com.gajraj.manager.feign;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.math.BigDecimal;
@FeignClient(name="PRODUCT")
public interface ProductPriceClient {
 record Change(UUID productId, BigDecimal oldPrice, BigDecimal newPrice) {}
 @PutMapping("/product/internal/approved-prices/{id}")
 Map<String,Boolean> apply(@PathVariable UUID id,@RequestHeader("X-Service-Token") String token,@RequestBody Change change);
}
