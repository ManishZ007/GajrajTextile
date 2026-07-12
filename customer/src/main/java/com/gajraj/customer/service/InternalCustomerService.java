package com.gajraj.customer.service;


import com.gajraj.customer.dto.AddressesDTO.AddressSaveRequestDTO;
import com.gajraj.customer.dto.CustomerDTO.CustomerProfileUpdateRequest;
import com.gajraj.customer.dto.CustomerDTO.CustomerUpdateInDataBase;
import com.gajraj.customer.dto.userDTO.SaveUserReq;
import com.gajraj.customer.model.Addresses;
import com.gajraj.customer.model.Customers;
import com.gajraj.customer.repo.AddressRepo;
import com.gajraj.customer.repo.CustomerRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class InternalCustomerService {

    @Autowired
    CustomerRepo customerRepo;

    @Autowired
    AddressRepo addressRepo;

    public ResponseEntity<?> saveNewUser(SaveUserReq saveNewUserFromAuth) {

        try {
            Customers newUserData = new Customers();

            newUserData.setUser_id(saveNewUserFromAuth.getUser_id());

            Customers saveCustomer = customerRepo.save(newUserData);

            if (saveCustomer != null)
                return ResponseEntity.ok(Map.of(
                        "message" , "customer created successfully",
                        "customer" , saveCustomer
                ));
            else
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                        "message", "something went wrong happen in customer database"
                ));

        }

        catch (Exception e) {
            System.err.println("data base error" + e.getMessage());
        }

        return ResponseEntity.ok(Map.of("success", true));

    }


    public ResponseEntity<?> customerProfileUpdate(String customer_id, CustomerProfileUpdateRequest customerProfileUpdateRequest) {

        try{

           CustomerUpdateInDataBase customerPayload = new CustomerUpdateInDataBase();

            customerPayload.setProfile_image_url(customerProfileUpdateRequest.getProfile_image_url());
            customerPayload.setGender(customerProfileUpdateRequest.getGender());
            customerPayload.setUpdatedAt(LocalDateTime.now());


            // convert dob String to LocalDate
            LocalDate dob = null;
            String dobString = customerProfileUpdateRequest.getDate_of_birth();

            if(dobString != null && !dobString.trim().isEmpty()){
                dob = LocalDate.parse(dobString);
            }
            customerPayload.setDate_of_birth(dob);
            System.out.println(dob);

            int customerUpdateCheck = customerRepo.updateCustomerProfileInfo(UUID.fromString(customer_id), customerPayload);
            System.out.println(customerUpdateCheck);
            if(customerUpdateCheck > 0) {
                Customers updatedCustomer = customerRepo.findById(UUID.fromString(customer_id)).orElseThrow(() -> new RuntimeException("something happen wrong while fetching updated customer customer-internal-service"));
                return ResponseEntity.ok(Map.of(
                        "message", "customer updated successfully",
                        "customer", updatedCustomer
                ));
            }else {
                throw new RuntimeException("update failed in customer-internal-service");
            }


        }catch (Exception e) {
            return ResponseEntity.ok("Hello this is error");
        }

    }

    public ResponseEntity<?> deleteCustomer(UUID customerId) {
        try {
            if (!customerRepo.existsById(customerId)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Customer not found"));
            }
            customerRepo.deleteById(customerId);
            return ResponseEntity.ok(Map.of("message", "Customer deleted"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to delete customer: " + e.getMessage()));
        }
    }

    public ResponseEntity<?> getAllCustomers(int page, int size, String search) {
        try {
            PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
            Page<Customers> result = (search != null && !search.isBlank())
                    ? customerRepo.searchByUserId(search, pageRequest)
                    : customerRepo.findAll(pageRequest);

            List<Map<String, Object>> content = result.getContent().stream().map(c -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", c.getId());
                m.put("userId", c.getUser_id());
                m.put("profileImageUrl", c.getProfileImageUrl());
                m.put("gender", c.getGender());
                m.put("dateOfBirth", c.getDateOfBirth());
                m.put("createdAt", c.getCreatedAt());
                m.put("updatedAt", c.getUpdatedAt());
                return m;
            }).collect(Collectors.toList());

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("content", content);
            response.put("totalElements", result.getTotalElements());
            response.put("totalPages", result.getTotalPages());
            response.put("page", page);
            response.put("size", size);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch customers: " + e.getMessage()));
        }
    }

    public ResponseEntity<?> getCustomerById(UUID customerId) {
        try {
            Customers customer = customerRepo.findById(customerId)
                    .orElseThrow(() -> new RuntimeException("Customer not found"));
            List<Addresses> addresses = addressRepo.findAddressByCustomerId(customerId);

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("id", customer.getId());
            response.put("userId", customer.getUser_id());
            response.put("profileImageUrl", customer.getProfileImageUrl());
            response.put("gender", customer.getGender());
            response.put("dateOfBirth", customer.getDateOfBirth());
            response.put("createdAt", customer.getCreatedAt());
            response.put("updatedAt", customer.getUpdatedAt());
            response.put("addresses", addresses);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    public ResponseEntity<?> addAddress(UUID customerId, AddressSaveRequestDTO dto) {
        try {
            Customers customer = customerRepo.findById(customerId)
                    .orElseThrow(() -> new RuntimeException("Customer not found"));

            Addresses address = new Addresses();
            address.setCustomer(customer);
            address.setLabel(dto.getLabel());
            address.setStreet(dto.getStreet());
            address.setCity(dto.getCity());
            address.setState(dto.getState());
            address.setPostalCode(dto.getPostalCode());
            address.setCountry(dto.getCountry());

            long existingCount = addressRepo.countByCustomerId(customerId);
            if (existingCount == 0 || Boolean.TRUE.equals(dto.getIsDefault())) {
                if (existingCount > 0) {
                    addressRepo.findDefaultAddressByCustomerId(customerId).ifPresent(existing -> {
                        existing.setIsDefault(false);
                        addressRepo.save(existing);
                    });
                }
                address.setIsDefault(true);
            } else {
                address.setIsDefault(false);
            }

            Addresses saved = addressRepo.save(address);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to add address: " + e.getMessage()));
        }
    }

    public ResponseEntity<?> updateAddress(Long addressId, UUID customerId, AddressSaveRequestDTO dto) {
        try {
            Addresses address = addressRepo.findById(addressId)
                    .orElseThrow(() -> new RuntimeException("Address not found"));

            if (!address.getCustomer().getId().equals(customerId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Address does not belong to this customer"));
            }

            address.setLabel(dto.getLabel());
            address.setStreet(dto.getStreet());
            address.setCity(dto.getCity());
            address.setState(dto.getState());
            address.setPostalCode(dto.getPostalCode());
            address.setCountry(dto.getCountry());

            if (Boolean.TRUE.equals(dto.getIsDefault()) && !Boolean.TRUE.equals(address.getIsDefault())) {
                addressRepo.findDefaultAddressByCustomerId(customerId).ifPresent(existing -> {
                    existing.setIsDefault(false);
                    addressRepo.save(existing);
                });
                address.setIsDefault(true);
            }

            Addresses saved = addressRepo.save(address);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to update address: " + e.getMessage()));
        }
    }

    public ResponseEntity<?> deleteAddress(Long addressId, UUID customerId) {
        try {
            Addresses address = addressRepo.findById(addressId)
                    .orElseThrow(() -> new RuntimeException("Address not found"));

            if (!address.getCustomer().getId().equals(customerId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Address does not belong to this customer"));
            }

            addressRepo.deleteById(addressId);
            return ResponseEntity.ok(Map.of("message", "Address deleted"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to delete address: " + e.getMessage()));
        }
    }

}
