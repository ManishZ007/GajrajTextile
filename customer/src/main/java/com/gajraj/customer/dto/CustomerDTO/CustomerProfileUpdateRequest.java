package com.gajraj.customer.dto.CustomerDTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
@ToString
public class CustomerProfileUpdateRequest {

    private String gender;
    private String date_of_birth;
    private String profile_image_url;

}
