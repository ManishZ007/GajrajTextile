package com.gajraj.authentication.dto.update_user;

import com.gajraj.authentication.dto.update_user.updateCustomer.UpdateCustomerDTO;
import com.gajraj.authentication.dto.update_user.updateUser.UpdateUserInfoDTO;
import com.gajraj.authentication.dto.update_user.updateWorker.UpdateWorkerDTO;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Data
@AllArgsConstructor
@NoArgsConstructor
@ToString
public class UpdateUserDTO {



    private String userType;

    //auth side user
    private UpdateUserInfoDTO userInfo;

    // customer
    private UpdateCustomerDTO customer;

    //worker side user
    private UpdateWorkerDTO worker;

}

