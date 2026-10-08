package com.gajraj.authentication.controller;


import com.gajraj.authentication.dto.auth.login.AuthLoginDTO;
import com.gajraj.authentication.dto.auth.oauth.FacebookOAuthRequestDTO;
import com.gajraj.authentication.dto.auth.oauth.GoogleOAuthRequestDTO;
import com.gajraj.authentication.dto.refresh_token.RequestRefreshTokenDTO;
import com.gajraj.authentication.dto.register.RegisterRequestDTO;
import com.gajraj.authentication.dto.update_user.UpdateUserDTO;
import com.gajraj.authentication.model.Users;
import com.gajraj.authentication.repo.UserRepo;
import com.gajraj.authentication.service.AuthService;
import com.gajraj.authentication.service.OAuthService;
import com.gajraj.authentication.service.jwtService.JWTService;
import com.gajraj.authentication.service.jwtService.RefreshTokenService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;


@RestController
@RequestMapping("auth")
public class AuthController {

    @Autowired
    AuthService authService;

    @Autowired
    JWTService jwtService;

    @Autowired
    RefreshTokenService refreshTokenService;

    @Autowired
    OAuthService oAuthService;

    @Autowired
    UserRepo userRepo;

    @Autowired
    PasswordEncoder passwordEncoder;

    @PostMapping("register")
    public ResponseEntity<?> register(@RequestBody RegisterRequestDTO request, Authentication authentication) {
        if (request.getRole() == Users.Role.OWNER || request.getRole() == Users.Role.MANAGER) {
            if (authentication == null || authentication.getAuthorities().stream().noneMatch(a -> a.getAuthority().equals("ROLE_OWNER")))
                return ResponseEntity.status(403).body(Map.of("message", "Only owners can create privileged accounts"));
        }
        if (request.getRole() == Users.Role.WORKER) {
            if (authentication == null || "anonymousUser".equals(authentication.getName()))
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Sign in to create workers"));
            var creator = userRepo.findById(UUID.fromString(authentication.getName())).orElse(null);
            if (creator == null || !(creator.getRole().name().equals("MANAGER") || creator.getRole().name().equals("OWNER")))
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Only managers or owners can create workers"));
            if (request.getWorker() != null) request.getWorker().setManagerId(authentication.getName());
        }
        return authService.register(request);
    }

    @PostMapping("login")
    public ResponseEntity<?> login(@RequestBody AuthLoginDTO loginDTO) {
        return authService.login(loginDTO.getEmail(), loginDTO.getPassword());
    }

    @PostMapping("/admin/login")
    public ResponseEntity<?> adminLogin(@RequestBody AuthLoginDTO loginDTO) {
        System.out.println("Hello");
        return authService.adminLogin(loginDTO.getEmail(), loginDTO.getPassword());
    }

    @PostMapping("/oauth/google")
    public ResponseEntity<?> oauthGoogle(@RequestBody GoogleOAuthRequestDTO body) {
        return oAuthService.loginWithGoogle(body.getId_token(), body.getRole());
    }

    @PostMapping("/oauth/facebook")
    public ResponseEntity<?> oauthFacebook(@RequestBody FacebookOAuthRequestDTO body) {
        return oAuthService.loginWithFacebook(body.getAccess_token(), body.getRole());
    }

    //update users by rolls
    @PutMapping("updateUser/{user_id}/{internal_call_id}")
    public ResponseEntity<?> updateUser(@PathVariable UUID user_id, @PathVariable String internal_call_id, @RequestBody UpdateUserDTO updateUserDTO, Authentication authentication) {
        if (!canManage(authentication,user_id)) return ResponseEntity.status(403).body(Map.of("message","Access denied"));
        return authService.updateUser(user_id, internal_call_id, updateUserDTO);
    }

    @DeleteMapping("deleteUser/{user_id}")
    public ResponseEntity<?> deleteUser(@PathVariable UUID user_id, Authentication authentication) {
        if (!canManage(authentication,user_id)) return ResponseEntity.status(403).body(Map.of("message","Access denied"));
        return authService.deleteUser(user_id);
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken (@RequestBody RequestRefreshTokenDTO request) {

        try{
            return authService.refreshToken(request);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("something went wrong, internal server error");
        }
    }

    @PostMapping("/admin/refresh")
    public ResponseEntity<?> adminRefreshToken(HttpServletRequest request, HttpServletResponse response) {
        return authService.adminRefreshToken(request, response);
    }


    @GetMapping("/internal/managers")
    public ResponseEntity<?> listManagers() {
        return authService.listByRole("MANAGER");
    }

    @PostMapping("/internal/managers")
    public ResponseEntity<?> createManager(@RequestBody RegisterRequestDTO request) {
        request.setRole(com.gajraj.authentication.model.Users.Role.MANAGER);
        return authService.register(request);
    }

    @PutMapping("/internal/managers/{managerId}")
    public ResponseEntity<?> updateManager(@PathVariable String managerId, @RequestBody UpdateUserDTO body) {
        try {
            java.util.UUID uid = java.util.UUID.fromString(managerId);
            if (userRepo.findById(uid).filter(u -> u.getRole() == Users.Role.MANAGER).isEmpty())
                return ResponseEntity.status(404).body(Map.of("message","Manager not found"));
            return authService.updateUser(uid, managerId, body);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid manager id");
        }
    }

    @PutMapping("/internal/managers/{managerId}/password")
    public ResponseEntity<?> changeManagerPassword(
            @PathVariable String managerId,
            @RequestBody java.util.Map<String, String> body) {
        String newPassword = body.get("password");
        if (newPassword == null || newPassword.length() < 8) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Password must be at least 8 characters");
        }
        try {
            java.util.UUID uid = java.util.UUID.fromString(managerId);
            if (userRepo.findById(uid).filter(u -> u.getRole() == Users.Role.MANAGER).isEmpty())
                return ResponseEntity.status(404).body(Map.of("message","Manager not found"));
            return authService.changePassword(uid, newPassword);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid manager id");
        }
    }

    @DeleteMapping("/internal/managers/{managerId}")
    public ResponseEntity<?> deleteManager(@PathVariable String managerId) {
        try {
            java.util.UUID uid = java.util.UUID.fromString(managerId);
            if (userRepo.findById(uid).filter(u -> u.getRole() == Users.Role.MANAGER).isEmpty())
                return ResponseEntity.status(404).body(Map.of("message","Manager not found"));
            return authService.deleteUser(uid);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid manager id");
        }
    }

    @GetMapping("/admin/me")
    public ResponseEntity<?> currentProfile(Authentication authentication) {
        if (authentication == null || "anonymousUser".equals(authentication.getName()))
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Not authenticated"));
        return authService.userInfo(authentication.getName());
    }

    @GetMapping("/getUserInfo")
    public ResponseEntity<?> userInfo (HttpServletRequest request) {
        String user_id = request.getHeader("X-User-Id");
        try{
            return authService.userInfo(user_id);

        }catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "message", "internal server error " + e.getMessage()
            ));

        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> body) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated() || auth.getPrincipal() == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Not authenticated"));
            }

            String userId = String.valueOf(auth.getPrincipal());
            String newPassword = body.get("newPassword");

            if (newPassword == null || newPassword.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("message", "newPassword is required"));
            }
            if (newPassword.length() < 8) {
                return ResponseEntity.badRequest().body(Map.of("message", "New password must be at least 8 characters"));
            }

            Users user = userRepo.findById(UUID.fromString(userId))
                    .orElseThrow(() -> new RuntimeException("User not found"));

            user.setPasswordHash(passwordEncoder.encode(newPassword));
            userRepo.save(user);

            return ResponseEntity.ok(Map.of("message", "Password changed successfully"));

        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Internal server error: " + e.getMessage()));
        }
    }


    private boolean canManage(Authentication auth, UUID target) {
        if (auth==null || "anonymousUser".equals(auth.getName())) return false;
        var role=auth.getAuthorities().stream().map(a->a.getAuthority()).toList();
        var user=userRepo.findById(target).orElse(null);
        if(user==null) return false;
        if(user.getRole()==Users.Role.MANAGER || user.getRole()==Users.Role.OWNER) return role.contains("ROLE_OWNER");
        return role.contains("ROLE_OWNER") || role.contains("ROLE_MANAGER") || target.toString().equals(auth.getName());
    }
}