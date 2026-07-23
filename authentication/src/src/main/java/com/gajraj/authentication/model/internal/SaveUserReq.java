package com.gajraj.authentication.model.internal;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SaveUserReq {
    private String user_id;
    private Integer workExperience;
    private String gender;
    private String dateOfBirth;
    private String managerId;
}
