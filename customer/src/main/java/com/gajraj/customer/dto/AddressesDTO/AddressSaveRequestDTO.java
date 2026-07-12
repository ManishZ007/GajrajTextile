package com.gajraj.customer.dto.AddressesDTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Data
@AllArgsConstructor
@NoArgsConstructor
@ToString
public class AddressSaveRequestDTO {

    private String label;       // Home / Office / Other
    private String street;
    private String city;
    private String state;
    private String postalCode;  // pin-code
    private String country;
    private Boolean isDefault;  // true / false
}
