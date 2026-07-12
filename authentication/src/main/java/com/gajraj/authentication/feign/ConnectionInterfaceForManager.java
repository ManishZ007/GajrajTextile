package com.gajraj.authentication.feign;

import com.gajraj.authentication.dto.update_user.updateManager.UpdateManagerDTO;
import com.gajraj.authentication.model.internal.SaveUserReq;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import java.util.Map;

@FeignClient("MANAGER")
public interface ConnectionInterfaceForManager {

    @PostMapping("/internal/saveNewUser")
    public ResponseEntity<Map<String, Object>> saveNewUser(@RequestBody SaveUserReq saveUserReq);

    @PostMapping("/internal/updateManager/{managerId}")
    public ResponseEntity<Map<String, Object>> updateManager(@PathVariable String managerId, @RequestBody UpdateManagerDTO managerDTO);
}
