package com.gajraj.authentication.dto.update_user.updateUser;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@ToString
public class UpdateUserInfoDTO {

    private String full_name;
    private String email;
    private String phone_number;
    private LocalDateTime updatedAt;
}
