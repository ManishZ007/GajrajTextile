package com.gajraj.authentication.feign;

import com.gajraj.authentication.dto.update_user.updateWorker.UpdateWorkerDTO;
import com.gajraj.authentication.model.internal.SaveUserReq;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;

@FeignClient("WORKER")
public interface ConnectionInterfaceForWorker {

    @PostMapping("/internal/saveNewUser")
    public ResponseEntity<Map<String, Object>> savaNewUser(@RequestBody SaveUserReq saveUserReq);

    @PostMapping("/internal/updateWorker/{workerId}")
    public ResponseEntity<Map<String, Object>> updateWorker(@PathVariable String workerId, @RequestBody UpdateWorkerDTO workerDTO);

}
