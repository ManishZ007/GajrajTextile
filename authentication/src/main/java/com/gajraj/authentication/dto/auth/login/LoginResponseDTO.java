package com.gajraj.authentication.dto.auth.login;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LoginResponseDTO {
    private String user_id;
    private String access_token;
    private String refresh_token;
    private Long expires_in;

}
