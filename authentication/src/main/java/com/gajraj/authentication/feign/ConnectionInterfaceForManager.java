package com.gajraj.authentication.feign;

import com.gajraj.authentication.dto.update_user.updateManager.UpdateManagerDTO;
import com.gajraj.authentication.model.internal.SaveUserReq;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import java.util.Map;

@FeignClient(name="MANAGER", configuration=ManagerCredentials.class)
public interface ConnectionInterfaceForManager {

    @org.springframework.web.bind.annotation.GetMapping("/manager/account/{id}/status")
    Map<String,Object> accountStatus(@PathVariable String id, @org.springframework.web.bind.annotation.RequestHeader("Authorization") String authorization);
    @PostMapping("/internal/saveNewUser")
    public ResponseEntity<Map<String, Object>> saveNewUser(@RequestBody SaveUserReq saveUserReq);

    @PostMapping("/internal/updateManager/{managerId}")
    public ResponseEntity<Map<String, Object>> updateManager(@PathVariable String managerId, @RequestBody UpdateManagerDTO managerDTO);

    @DeleteMapping("/internal/managers/{managerId}")
    public ResponseEntity<Map<String, Object>> deleteManager(@PathVariable String managerId, @org.springframework.web.bind.annotation.RequestHeader("Authorization") String authorization);
}
