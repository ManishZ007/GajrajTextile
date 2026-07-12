package com.gajraj.customer.controller;


import com.gajraj.customer.dto.AddressesDTO.AddressSaveRequestDTO;
import com.gajraj.customer.dto.CustomerDTO.CustomerProfileUpdateRequest;
import com.gajraj.customer.dto.userDTO.SaveUserReq;
import com.gajraj.customer.feign.ConnectionInterface;
import com.gajraj.customer.service.CustomerService;
import com.gajraj.customer.service.InternalCustomerService;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("internal")
public class InternalCustomerController {

    @Autowired
    InternalCustomerService internalService;

    @Autowired
    CustomerService customerService;

    @Autowired
    ConnectionInterface authentication;

    @PostMapping("saveNewUser")
    public ResponseEntity<?> saveNewUser(@RequestBody SaveUserReq saveUserReq) {
        return internalService.saveNewUser(saveUserReq);
    }

    @PutMapping("/updateCustomer/{customerId}")
    public ResponseEntity<?> updateCustomerProfile(@PathVariable String customerId, @RequestBody CustomerProfileUpdateRequest customerProfileUpdateRequest) {
        return internalService.customerProfileUpdate(customerId, customerProfileUpdateRequest);
    }

    @DeleteMapping("/customers/{customerId}")
    public ResponseEntity<?> deleteCustomer(@PathVariable UUID customerId) {
        return internalService.deleteCustomer(customerId);
    }

    @GetMapping("/customers/profile/{userId}")
    public ResponseEntity<?> getCustomerProfile(@PathVariable String userId) {
        try {
            ResponseEntity<Map<String, Object>> authResponse = authentication.userInfo(userId);
            ResponseEntity<?> customer = customerService.getCustomerProfile(userId);
            return ResponseEntity.ok(Map.of(
                    "customer", customer.getBody(),
                    "authentication", authResponse.getBody()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/customers")
    public ResponseEntity<?> getAllCustomers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(required = false) String search) {
        return internalService.getAllCustomers(page, size, search);
    }

    @GetMapping("/customers/{customerId}")
    public ResponseEntity<?> getCustomerById(@PathVariable UUID customerId) {
        return internalService.getCustomerById(customerId);
    }

    @PostMapping("/customers/{customerId}/address")
    public ResponseEntity<?> addAddress(@PathVariable UUID customerId, @RequestBody AddressSaveRequestDTO dto) {
        return internalService.addAddress(customerId, dto);
    }

    @PutMapping("/customers/{customerId}/address/{addressId}")
    public ResponseEntity<?> updateAddress(@PathVariable UUID customerId, @PathVariable Long addressId, @RequestBody AddressSaveRequestDTO dto) {
        return internalService.updateAddress(addressId, customerId, dto);
    }

    @DeleteMapping("/customers/{customerId}/address/{addressId}")
    public ResponseEntity<?> deleteAddress(@PathVariable UUID customerId, @PathVariable Long addressId) {
        return internalService.deleteAddress(addressId, customerId);
    }

}
