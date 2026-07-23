package com.gajraj.authentication.dto.register;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class WorkerRegisterDTO {
    private Integer workExperience;
    private String gender;
    private String dateOfBirth;
    private String managerId;
}
