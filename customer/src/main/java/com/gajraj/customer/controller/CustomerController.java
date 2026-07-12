package com.gajraj.customer.controller;



import com.gajraj.customer.dto.AddressesDTO.AddressSaveRequestDTO;
import com.gajraj.customer.feign.ConnectionInterface;
import com.gajraj.customer.service.CustomerService;
import org.apache.coyote.Response;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("customer")
public class CustomerController {

    @Autowired
    CustomerService service;


    @Autowired
    ConnectionInterface authentication;



    // get customer Profile we need the jwt token for that
    @GetMapping("/profile")
    public ResponseEntity<?> getProfile() {
        ResponseEntity<Map<String, Object>> authResponse = null;
        ResponseEntity<?> customer = null;
        try {
            String user_id = SecurityContextHolder.getContext().getAuthentication().getPrincipal().toString();
            //auth service
            try{
                authResponse = authentication.userInfo(user_id);
            }catch (Exception e) {
                ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("auth server gives an error " + e.getMessage());
            }
            // customer data
            try{
                customer = service.getCustomerProfile(user_id);
            }catch (Exception e) {
                ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("customer server gives an error " + e.getMessage());
            }


            // response varification
            if (authResponse == null || authResponse.getBody() == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "auth not found");
            }
            if (customer == null || customer.getBody() == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "customer not found");
            }
            return ResponseEntity.status(HttpStatus.OK).body(Map.of(
                    "customer", customer.getBody(),
                    "authentication", authResponse.getBody()
            ));


        }catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("error :- " + e.getMessage());
        }

    }


    @PostMapping("/address")
    public ResponseEntity<?> saveAddress(@RequestBody AddressSaveRequestDTO addressSaveRequestDTO) {
        String user_id = SecurityContextHolder.getContext().getAuthentication().getPrincipal().toString();
        try{
            return service.saveAddress(user_id, addressSaveRequestDTO);
        }catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("internal server error");
        }
    }

    @GetMapping("/address")
    public ResponseEntity<?> getAddress() {
        return service.getAddress();
    }


}
