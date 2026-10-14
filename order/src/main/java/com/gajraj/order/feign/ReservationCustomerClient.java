package com.gajraj.order.feign;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
@FeignClient(name="CUSTOMER",contextId="reservationCustomer")
public interface ReservationCustomerClient {
    @GetMapping("/customer/profile") Map<String,Object> profile(@RequestHeader("Authorization") String authorization);
}
