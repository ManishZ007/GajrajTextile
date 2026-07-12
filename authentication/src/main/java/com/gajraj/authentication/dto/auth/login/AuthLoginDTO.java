package com.gajraj.authentication.dto.auth.login;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuthLoginDTO {
    private String email;
    private String password;
}
