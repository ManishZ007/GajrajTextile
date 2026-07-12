package com.gajraj.authentication.feign;


import com.gajraj.authentication.dto.update_user.updateCustomer.UpdateCustomerDTO;
import com.gajraj.authentication.model.internal.SaveUserReq;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;
import java.util.UUID;

@FeignClient("CUSTOMER")
public interface ConnectionInterfaceForCustomer {

    @PostMapping("/internal/saveNewUser")
    public ResponseEntity<Map<String, Object>> saveNewUser(@RequestBody SaveUserReq saveUserReq);

    @PutMapping("/internal/updateCustomer/{customerId}")
    public ResponseEntity<Map<String, Object>> updateCustomerProfile(@PathVariable String customerId, @RequestBody UpdateCustomerDTO updateCustomer);
}

