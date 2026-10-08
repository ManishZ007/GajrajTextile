package com.gajraj.customer.service;



import com.gajraj.customer.dto.AddressesDTO.AddressSaveRequestDTO;
import com.gajraj.customer.model.Addresses;
import com.gajraj.customer.model.Customers;
import java.util.List;
import com.gajraj.customer.repo.AddressRepo;
import com.gajraj.customer.repo.CustomerRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;


@Service
public class CustomerService {

    @Autowired
    CustomerRepo customerRepo;

    @Autowired
    AddressRepo addressRepo;


    public ResponseEntity<?> getCustomerProfile (String user_id) {
        Customers customer = customerRepo.findCustomerByUserId(user_id);
        return ResponseEntity.ok(customer);

    }

    // ── Address CRUD ──────────────────────────────────────────────────────────────

    public ResponseEntity<?> saveAddress(String user_id, AddressSaveRequestDTO dto) {
        try {
            Customers customer = customerRepo.findCustomerByUserId(user_id);
            if (customer == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Customer not found");

            Addresses payload = buildAddress(dto, customer);

            long existingCount = addressRepo.countByCustomerId(customer.getId());
            if (existingCount == 0) {
                payload.setIsDefault(true);
            } else if (Boolean.TRUE.equals(payload.getIsDefault())) {
                addressRepo.findDefaultAddressByCustomerId(customer.getId()).ifPresent(existing -> {
                    existing.setIsDefault(false);
                    addressRepo.save(existing);
                });
            }

            Addresses saved = addressRepo.save(payload);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("internal server error: " + e.getMessage());
        }
    }

    public ResponseEntity<?> updateAddress(String user_id, Long addressId, AddressSaveRequestDTO dto) {
        try {
            Customers customer = customerRepo.findCustomerByUserId(user_id);
            if (customer == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Customer not found");

            Addresses existing = addressRepo.findById(addressId)
                    .orElseThrow(() -> new RuntimeException("Address not found"));

            if (!existing.getCustomer().getId().equals(customer.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Not your address");
            }

            if (Boolean.TRUE.equals(dto.getIsDefault()) && !Boolean.TRUE.equals(existing.getIsDefault())) {
                addressRepo.findDefaultAddressByCustomerId(customer.getId()).ifPresent(prev -> {
                    prev.setIsDefault(false);
                    addressRepo.save(prev);
                });
            }

            existing.setLabel(dto.getLabel());
            existing.setStreet(dto.getStreet());
            existing.setCity(dto.getCity());
            existing.setState(dto.getState());
            existing.setPostalCode(dto.getPostalCode());
            existing.setCountry(dto.getCountry());
            existing.setIsDefault(dto.getIsDefault());

            Addresses updated = addressRepo.save(existing);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("internal server error: " + e.getMessage());
        }
    }

    public ResponseEntity<?> deleteAddress(String user_id, Long addressId) {
        try {
            Customers customer = customerRepo.findCustomerByUserId(user_id);
            if (customer == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Customer not found");

            Addresses address = addressRepo.findById(addressId)
                    .orElseThrow(() -> new RuntimeException("Address not found"));

            if (!address.getCustomer().getId().equals(customer.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Not your address");
            }

            addressRepo.delete(address);
            return ResponseEntity.ok("Address deleted");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("internal server error: " + e.getMessage());
        }
    }

    public ResponseEntity<?> getAddress() {
        try {
            String user_id = SecurityContextHolder.getContext().getAuthentication().getPrincipal().toString();
            Customers customer = customerRepo.findCustomerByUserId(user_id);
            List<Addresses> addresses = addressRepo.findAddressByCustomerId(customer.getId());
            return ResponseEntity.ok(addresses);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("internal server error");
        }
    }

    private Addresses buildAddress(AddressSaveRequestDTO dto, Customers customer) {
        Addresses a = new Addresses();
        a.setCustomer(customer);
        a.setLabel(dto.getLabel());
        a.setStreet(dto.getStreet());
        a.setCity(dto.getCity());
        a.setState(dto.getState());
        a.setPostalCode(dto.getPostalCode());
        a.setCountry(dto.getCountry());
        a.setIsDefault(dto.getIsDefault());
        return a;
    }


}
