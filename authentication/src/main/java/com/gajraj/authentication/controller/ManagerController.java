package com.gajraj.authentication.controller;

import com.gajraj.authentication.model.Users;
import com.gajraj.authentication.repo.UserRepo;
import com.gajraj.authentication.service.AuthService;
import com.gajraj.authentication.dto.register.RegisterRequestDTO;
import com.gajraj.authentication.dto.update_user.UpdateUserDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/auth/managers")
public class ManagerController {

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private AuthService authService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // GET all managers
    @GetMapping
    public ResponseEntity<?> getAllManagers() {
        try {
            List<Users> managers = userRepo.findByRoleOrderByCreatedAtDesc(Users.Role.MANAGER);
            List<Map<String, Object>> result = managers.stream().map(u -> {
                Map<String, Object> m = new java.util.LinkedHashMap<>();
                m.put("userId", u.getUser_id());
                m.put("fullName", u.getFullName());
                m.put("email", u.getEmail());
                m.put("phoneNumber", u.getPhoneNumber());
                m.put("role", u.getRole());
                m.put("createdAt", u.getCreatedAt());
                m.put("updatedAt", u.getUpdatedAt());
                return m;
            }).toList();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // GET single manager
    @GetMapping("/{userId}")
    public ResponseEntity<?> getManager(@PathVariable UUID userId) {
        try {
            Users user = userRepo.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Manager not found"));
            if (user.getRole() != Users.Role.MANAGER) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "User is not a manager"));
            }
            Map<String, Object> result = new java.util.LinkedHashMap<>();
            result.put("userId", user.getUser_id());
            result.put("fullName", user.getFullName());
            result.put("email", user.getEmail());
            result.put("phoneNumber", user.getPhoneNumber());
            result.put("role", user.getRole());
            result.put("createdAt", user.getCreatedAt());
            result.put("updatedAt", user.getUpdatedAt());
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // POST register a manager (owner creates manager)
    @PostMapping("/register")
    public ResponseEntity<?> registerManager(@RequestBody RegisterRequestDTO request) {
        request.setRole(Users.Role.MANAGER);
        return authService.register(request);
    }

    // PUT update manager info
    @PutMapping("/{userId}")
    public ResponseEntity<?> updateManager(@PathVariable UUID userId,
                                           @RequestBody UpdateUserDTO updateUserDTO) {
        requireManager(userId);
        return authService.updateUser(userId, "MANAGER", updateUserDTO);
    }

    // PUT change password
    @PutMapping("/{userId}/password")
    public ResponseEntity<?> changePassword(@PathVariable UUID userId,
                                            @RequestBody Map<String, String> body) {
        requireManager(userId);
        String password=body.get("password");
        if(password==null || password.length()<8 || password.getBytes(java.nio.charset.StandardCharsets.UTF_8).length>72)
            return ResponseEntity.badRequest().body(Map.of("error","Use at least 8 characters and at most 72 UTF-8 bytes"));
        return authService.changePassword(userId,password);
    }

    // DELETE manager
    @DeleteMapping("/{userId}")
    public ResponseEntity<?> deleteManager(@PathVariable UUID userId) {
        requireManager(userId);
        return authService.deleteUser(userId);
    }
    private void requireManager(UUID id) {
        if (userRepo.findById(id).filter(u -> u.getRole() == Users.Role.MANAGER).isEmpty())
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.NOT_FOUND, "Manager not found");
    }
}
