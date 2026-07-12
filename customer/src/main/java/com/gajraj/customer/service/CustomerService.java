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

    //Address function
    public ResponseEntity<?> saveAddress(String user_id, AddressSaveRequestDTO addressSaveRequestDTO) {
        Customers customer;
        try {
            customer = customerRepo.findCustomerByUserId(user_id);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("internal server error: " + e.getMessage());
        }

        try {
            Addresses payload = getAddressesPayload(addressSaveRequestDTO, customer);

            long existingCount = addressRepo.countByCustomerId(customer.getId());

            if (existingCount == 0) {
                // first address — always default
                payload.setIsDefault(true);
            } else if (Boolean.TRUE.equals(payload.getIsDefault())) {
                // new address wants to be default — unset the current one
                addressRepo.findDefaultAddressByCustomerId(customer.getId()).ifPresent(existing -> {
                    existing.setIsDefault(false);
                    addressRepo.save(existing);
                });
            }

            addressRepo.save(payload);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("internal server error: " + e.getMessage());
        }

        return ResponseEntity.ok("address is saved");
    }

    private Addresses getAddressesPayload(AddressSaveRequestDTO addressSaveRequestDTO, Customers customer) {
        Addresses payload = new Addresses();

        payload.setCustomer(customer);
        payload.setCity(addressSaveRequestDTO.getCity());
        payload.setLabel(addressSaveRequestDTO.getLabel());
        payload.setCountry(addressSaveRequestDTO.getCountry());
        payload.setStreet(addressSaveRequestDTO.getStreet());
        payload.setState(addressSaveRequestDTO.getState());
        payload.setPostalCode(addressSaveRequestDTO.getPostalCode());
        payload.setIsDefault(addressSaveRequestDTO.getIsDefault());
        return payload;
    }


    public ResponseEntity<?> getAddress() {
        try{
            String user_id = SecurityContextHolder.getContext().getAuthentication().getPrincipal().toString();
            Customers customers = customerRepo.findCustomerByUserId(user_id);
            List<Addresses> addresses = addressRepo.findAddressByCustomerId(customers.getId());
            return ResponseEntity.ok(addresses);
        }catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("internal server error");
        }
    }


}
