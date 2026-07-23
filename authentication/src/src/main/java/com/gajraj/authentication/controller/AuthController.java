package com.gajraj.authentication.controller;


import com.gajraj.authentication.dto.auth.login.AuthLoginDTO;
import com.gajraj.authentication.dto.auth.oauth.FacebookOAuthRequestDTO;
import com.gajraj.authentication.dto.auth.oauth.GoogleOAuthRequestDTO;
import com.gajraj.authentication.dto.refresh_token.RequestRefreshTokenDTO;
import com.gajraj.authentication.dto.refresh_token.ResponseRefreshTokenDTO;
import com.gajraj.authentication.dto.register.RegisterRequestDTO;
import com.gajraj.authentication.dto.update_user.UpdateUserDTO;
import com.gajraj.authentication.model.RefreshToken;
import com.gajraj.authentication.model.Users;
import com.gajraj.authentication.service.AuthService;
import com.gajraj.authentication.service.OAuthService;
import com.gajraj.authentication.service.jwtService.JWTService;
import com.gajraj.authentication.service.jwtService.RefreshTokenService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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

    @PostMapping("register")
    public ResponseEntity<?> register(@RequestBody RegisterRequestDTO request) {
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
    public ResponseEntity<?> updateUser(@PathVariable UUID user_id, @PathVariable String internal_call_id, @RequestBody UpdateUserDTO updateUserDTO) {
        return authService.updateUser(user_id, internal_call_id, updateUserDTO);
    }

    @DeleteMapping("deleteUser/{user_id}")
    public ResponseEntity<?> deleteUser(@PathVariable UUID user_id) {
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



}