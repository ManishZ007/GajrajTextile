package com.gajraj.order.dto.dealer;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DealerRequestDTO {
    private String name;
    private String phone;
    private String email;
    private String address;
    private String city;
    private String state;
    private String dealerType;
    private String gstNumber;
    private String notes;
}
