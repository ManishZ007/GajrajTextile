package com.gajraj.authentication.dto.auth.oauth;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class FacebookOAuthRequestDTO {
    private String access_token;
    private String role;
}
