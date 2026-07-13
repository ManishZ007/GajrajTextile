package com.gajraj.authentication.dto.update_user.updateCustomer;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Data
@AllArgsConstructor
@NoArgsConstructor
@ToString
public class UpdateCustomerDTO {

    private String gender;
    private String date_of_birth;
    private String profile_image_url;

}
