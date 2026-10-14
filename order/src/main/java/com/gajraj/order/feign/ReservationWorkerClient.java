package com.gajraj.order.feign;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;
import java.util.*;
@FeignClient(name="WORKER",contextId="reservationWorker")
public interface ReservationWorkerClient {
    @PutMapping("/internal/reservation-work/{id}") Map<String,Object> assign(@PathVariable UUID id,@RequestHeader("X-Service-Token") String token,@RequestBody Map<String,Object> body);
    @PutMapping("/internal/reservation-work/{id}/status") Map<String,Object> status(@PathVariable UUID id,@RequestHeader("X-Service-Token") String token,@RequestBody Map<String,String> body);
}
