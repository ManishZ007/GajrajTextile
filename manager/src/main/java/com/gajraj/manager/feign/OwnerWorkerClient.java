package com.gajraj.manager.feign;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;
import java.util.*;
@FeignClient(name="WORKER",contextId="ownerWorkerActivity")
public interface OwnerWorkerClient {
    @GetMapping("/owner/managers/{id}/workers")
    List<Map<String,Object>> workers(@PathVariable String id,@RequestHeader("Authorization") String authorization);
}
