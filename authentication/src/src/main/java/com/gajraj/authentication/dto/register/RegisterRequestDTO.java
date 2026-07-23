package com.gajraj.authentication.dto.register;

import com.gajraj.authentication.model.Users;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RegisterRequestDTO {
    private String fullName;
    private String email;
    private String phoneNumber;
    private String passwordHash;
    private Users.Role role;

    private WorkerRegisterDTO worker;

    public Users toUser() {
        Users u = new Users();
        u.setFullName(fullName);
        u.setEmail(email);
        u.setPhoneNumber(phoneNumber);
        u.setPasswordHash(passwordHash);
        u.setRole(role);
        return u;
    }
}
