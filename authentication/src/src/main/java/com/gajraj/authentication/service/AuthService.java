package com.gajraj.authentication.service;



import com.gajraj.authentication.dto.auth.login.LoginResponseDTO;
import com.gajraj.authentication.dto.refresh_token.RequestRefreshTokenDTO;
import com.gajraj.authentication.dto.refresh_token.ResponseRefreshTokenDTO;
import com.gajraj.authentication.dto.update_user.UpdateUserDTO;
import com.gajraj.authentication.dto.update_user.updateCustomer.UpdateCustomerDTO;
import com.gajraj.authentication.dto.update_user.updateUser.UpdateUserInfoDTO;
import com.gajraj.authentication.dto.update_user.updateWorker.UpdateWorkerDTO;
import com.gajraj.authentication.dto.user.UserResponseDTO;
import com.gajraj.authentication.feign.ConnectionInterfaceForCustomer;
import com.gajraj.authentication.feign.ConnectionInterfaceForManager;
import com.gajraj.authentication.feign.ConnectionInterfaceForWorker;
import com.gajraj.authentication.model.RefreshToken;
import com.gajraj.authentication.model.Users;
import com.gajraj.authentication.model.internal.SaveUserReq;
import com.gajraj.authentication.notify.AuthEmailNotification;
import com.gajraj.authentication.repo.RefreshTokenRepo;
import com.gajraj.authentication.repo.UserRepo;
import com.gajraj.authentication.service.jwtService.JWTService;
import com.gajraj.authentication.service.jwtService.RefreshTokenService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private RefreshTokenRepo refreshTokenRepo;

    @Autowired
    JWTService jwtService;

    @Autowired
    RefreshTokenService refreshTokenService;

    @Autowired
    PasswordEncoder passwordEncoder;

    @Autowired
    AuthEmailNotification notification;


    @Autowired
    ConnectionInterfaceForCustomer customer;
    @Autowired
    ConnectionInterfaceForWorker worker;
    @Autowired
    ConnectionInterfaceForManager manager;

    @Value("${jwt.expiration}")
    private long expiration;


    // bCryptPassword
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);


    // register
    public ResponseEntity<?> register(Users user)  {
        try{
            if (user.getEmail() == null || user.getPasswordHash() == null || user.getRole() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("email, password and role are required");
            }

            if(userRepo.findByEmail(user.getEmail()) != null ) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body("email already registered try another one");
            }

            user.setPasswordHash(encoder.encode(user.getPasswordHash()));

            Users saveUsers = userRepo.save(user);

            SaveUserReq payload = new SaveUserReq();
            payload.setUser_id(saveUsers.getUser_id().toString());

            ResponseEntity<Map<String, Object>> commonResponse;
            try {
                switch (saveUsers.getRole()) {
                    case CUSTOMER:
                        safeSendEmail(() -> notification.sendRegistrationEmailToCustomer(saveUsers.getEmail(), saveUsers.getFullName()));
                        commonResponse = customer.saveNewUser(payload);
                        break;
                    case WORKER:
                        safeSendEmail(() -> notification.sendRegistrationEmailToWorker(saveUsers.getEmail(), saveUsers.getFullName()));
                        commonResponse = worker.savaNewUser(payload);
                        break;
                    case MANAGER:
                        safeSendEmail(() -> notification.sendRegistrationEmailToManager(saveUsers.getEmail(), saveUsers.getFullName()));
                        commonResponse = manager.saveNewUser(payload);
                        break;
                    case OWNER:
                        safeSendEmail(() -> notification.sendRegistrationEmailToManager(saveUsers.getEmail(), saveUsers.getFullName()));
                        commonResponse = ResponseEntity.ok(Map.of("message", "Owner created"));
                        break;
                    default:
                        userRepo.delete(saveUsers);
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("unsupported role: " + saveUsers.getRole());
                }
            } catch (Exception e) {
                // downstream service failed — roll back the auth user so we don't leave an orphan
                userRepo.delete(saveUsers);
                e.printStackTrace();
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body("downstream service failed during registration, please retry");
            }

            if (commonResponse == null || !commonResponse.getStatusCode().is2xxSuccessful()) {
                userRepo.delete(saveUsers);
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body("downstream service did not accept the new user");
            }

            UserResponseDTO response = new UserResponseDTO(
                    saveUsers.getUser_id(), saveUsers.getFullName(), saveUsers.getEmail(), saveUsers.getPhoneNumber(), saveUsers.getRole().name(), saveUsers.getCreatedAt(), saveUsers.getUpdatedAt(), commonResponse.getBody()
            );

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("something went wrong while registering the user");
        }

    }

    private void safeSendEmail(Runnable send) {
        try {
            send.run();
        } catch (Exception e) {
            System.err.println("Email sending failed: " + e.getMessage());
        }
    }


    //login
    public  ResponseEntity<?> login (String email, String password) {

        LoginResponseDTO loginResponse = new LoginResponseDTO();

        try{
            Users user = userRepo.findByEmail(email);

            if(user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found with this email: " + email);
            }

            if (user.getAuthProvider() != null && user.getAuthProvider() != Users.AuthProvider.LOCAL) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body("this account uses " + user.getAuthProvider().name() + " sign-in, please use that provider");
            }

            if (user.getPasswordHash() == null
                    || !passwordEncoder.matches(password, user.getPasswordHash())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
            }

            RefreshToken isRefreshTokenAvailable = refreshTokenRepo.findByUserId(user.getUser_id());

            if(isRefreshTokenAvailable == null) {
                String accessToken =  jwtService.generateToken(user.getUser_id().toString(), user.getRole().name()); // 15 min
                RefreshToken refresh_token = refreshTokenService.createRefreshToken(user); // 10 days


                loginResponse.setAccess_token(accessToken);
                loginResponse.setRefresh_token(refresh_token.getRefreshToken());

            }else {
                String updatedAccessToken = jwtService.generateToken(user.getUser_id().toString(), user.getRole().name());
                String updatedRefreshToken = refreshTokenService.updateRefreshToken(user.getUser_id());


                loginResponse.setAccess_token(updatedAccessToken);
                loginResponse.setRefresh_token(updatedRefreshToken);


            }
            loginResponse.setUser_id(user.getUser_id().toString());
            loginResponse.setExpires_in(expiration);
            return ResponseEntity.ok(loginResponse);

        }catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("something went wrong while logging the user");
        }

    }


//    manager login
    public ResponseEntity<?> adminLogin(String email, String password) {
        LoginResponseDTO loginResponse = new LoginResponseDTO();

        try{
            Users user = userRepo.findByEmail(email);

            if(user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found with this email: " + email);
            }

            if (user.getAuthProvider() != null && user.getAuthProvider() != Users.AuthProvider.LOCAL) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body("this account uses " + user.getAuthProvider().name() + " sign-in, please use that provider");
            }

            if (user.getPasswordHash() == null
                    || !passwordEncoder.matches(password, user.getPasswordHash())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
            }

            if(user.getRole() != Users.Role.MANAGER && user.getRole() != Users.Role.OWNER) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Access denied. Only managers and owners can login here.");
            }

            RefreshToken isRefreshTokenAvailable = refreshTokenRepo.findByUserId(user.getUser_id());

            if(isRefreshTokenAvailable == null) {
                String accessToken =  jwtService.generateToken(user.getUser_id().toString(), user.getRole().name()); // 15 min
                RefreshToken refresh_token = refreshTokenService.createRefreshToken(user); // 10 days


                loginResponse.setAccess_token(accessToken);
                loginResponse.setRefresh_token(refresh_token.getRefreshToken());

            }else {
                String updatedAccessToken = jwtService.generateToken(user.getUser_id().toString(), user.getRole().name());
                String updatedRefreshToken = refreshTokenService.updateRefreshToken(user.getUser_id());


                loginResponse.setAccess_token(updatedAccessToken);
                loginResponse.setRefresh_token(updatedRefreshToken);


            }
            loginResponse.setUser_id(user.getUser_id().toString());
            loginResponse.setExpires_in(expiration);

            ResponseCookie accessCookie =  ResponseCookie.from("access_token")
                    .value(loginResponse.getAccess_token())
                    .httpOnly(true)
                    .secure(true)
                    .path("/")
                    .maxAge(expiration)
                    .sameSite("Strict")
                    .build();

            ResponseCookie refreshCookie =  ResponseCookie.from("refresh_token")
                    .value(loginResponse.getRefresh_token())
                    .httpOnly(true)
                    .secure(true)
                    .path("/")
                    .maxAge(60L * 60L * 24L * 10L)
                    .sameSite("Strict")
                    .build();


            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                    .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                    .body(Map.of("user_id", loginResponse.getUser_id(),
                                "role", user.getRole().name(),
                                "access_token", loginResponse.getAccess_token()));



        }catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("something went wrong while logging the user");
        }
    }



    public ResponseEntity<?> refreshToken(RequestRefreshTokenDTO request) {


        try{
            if (request == null || request.getRequest() == null || request.getRequest().isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("refresh token is required");
            }

            RefreshToken token = refreshTokenService.getByToken(request.getRequest());

            if (token == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("invalid refresh token, login again");
            }

            if(refreshTokenService.verifyExpiration(token)) {
                Users user = token.getUser();
                String new_access_token = jwtService.generateToken(user.getUser_id().toString(), user.getRole().name());
                ResponseRefreshTokenDTO responseRefreshTokenDTO = new ResponseRefreshTokenDTO();
                responseRefreshTokenDTO.setNew_access_token(new_access_token);

                return ResponseEntity.ok(responseRefreshTokenDTO);
            }else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("login again");
            }
        }catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("internal server error " + e.getMessage());
        }
    }


    public ResponseEntity<?> adminRefreshToken(HttpServletRequest req, HttpServletResponse res) {
        try{
            String refreshToken = null;

            if(req.getCookies() != null) {
                for(Cookie cookie: req.getCookies()) {
                    if(cookie.getName().equals("refresh_token")) {
                        refreshToken = cookie.getValue();
                        break;
                    }
                }
            }

            if(refreshToken == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("No refresh token");
            }

            RefreshToken token = refreshTokenService.getByToken(refreshToken);

            if (token == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("invalid refresh token, login again");
            }

            if(refreshTokenService.verifyExpiration(token)) {
                Users user = token.getUser();
                String new_access_token = jwtService.generateToken(user.getUser_id().toString(), user.getRole().name());

                ResponseCookie accessCookie = ResponseCookie.from("access_token")
                        .value(new_access_token)
                        .httpOnly(true)
                        .path("/")
                        .maxAge(expiration)
                        .secure(true)
                        .sameSite("Strict")
                        .build();

                return ResponseEntity.ok()
                        .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                        .body(Map.of("success", true, "access_token", new_access_token));


            }else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("login again");
            }

        }catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("internal server error " + e.getMessage());
        }
    }



    public ResponseEntity<?> updateUser (UUID user_id, String service_call_id, UpdateUserDTO updateUserRequest) {
        try {
            if (updateUserRequest == null || updateUserRequest.getUserInfo() == null || updateUserRequest.getUserType() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("userInfo and userType are required");
            }

            UpdateUserInfoDTO userPayload = new UpdateUserInfoDTO();
            userPayload.setFull_name(updateUserRequest.getUserInfo().getFull_name());
            userPayload.setEmail(updateUserRequest.getUserInfo().getEmail());
            userPayload.setPhone_number(updateUserRequest.getUserInfo().getPhone_number());
            userPayload.setUpdatedAt(LocalDateTime.now());

            int checkAuthUserUpdate = userRepo.updateUserData(user_id, userPayload);
            if (checkAuthUserUpdate <= 0) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("user not found or no fields changed");
            }

            Users updatedUser = userRepo.findById(user_id)
                    .orElse(null);
            if (updatedUser == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("user not found after update");
            }

            ResponseEntity<Map<String, Object>> updatedCommonResponse;
            String userType = updateUserRequest.getUserType();
            try {
                if ("CUSTOMER".equals(userType)) {
                    if (updateUserRequest.getCustomer() == null) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("customer payload is required for CUSTOMER updates");
                    }
                    UpdateCustomerDTO customerPayload = new UpdateCustomerDTO();
                    customerPayload.setGender(updateUserRequest.getCustomer().getGender());
                    customerPayload.setProfile_image_url(updateUserRequest.getCustomer().getProfile_image_url());
                    customerPayload.setDate_of_birth(updateUserRequest.getCustomer().getDate_of_birth());
                    updatedCommonResponse = customer.updateCustomerProfile(service_call_id, customerPayload);
                } else if ("WORKER".equals(userType)) {
                    if (updateUserRequest.getWorker() == null) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("worker payload is required for WORKER updates");
                    }
                    UpdateWorkerDTO workerPayload = new UpdateWorkerDTO();
                    workerPayload.setGender(updateUserRequest.getWorker().getGender());
                    workerPayload.setDate_of_birth(updateUserRequest.getWorker().getDate_of_birth());
                    workerPayload.setWorker_profile_image(updateUserRequest.getWorker().getWorker_profile_image());
                    workerPayload.setWorker_experience(updateUserRequest.getWorker().getWorker_experience());
                    updatedCommonResponse = worker.updateWorker(service_call_id, workerPayload);
                } else {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("unsupported userType: " + userType);
                }
            } catch (Exception e) {
                e.printStackTrace();
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body("downstream service call failed for " + userType);
            }

            if (updatedCommonResponse == null || !updatedCommonResponse.getStatusCode().is2xxSuccessful()) {
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body("downstream service rejected the update");
            }

            UserResponseDTO response = new UserResponseDTO(
                    updatedUser.getUser_id(),
                    updatedUser.getFullName(),
                    updatedUser.getEmail(),
                    updatedUser.getPhoneNumber(),
                    updatedUser.getRole().name(),
                    updatedUser.getCreatedAt(),
                    updatedUser.getUpdatedAt(),
                    updatedCommonResponse.getBody()
            );
            return ResponseEntity.status(HttpStatus.OK).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("something went wrong in authentication service section");
        }
    }


    public ResponseEntity<?> userInfo(String user_id){
        if (user_id == null || user_id.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "message", "X-User-Id header is missing"
            ));
        }

        UUID userId;
        try {
            userId = UUID.fromString(user_id);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "message", "X-User-Id is not a valid UUID"
            ));
        }

        try{
            Users user = userRepo.findById(userId).orElse(null);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                        "message", "user not found"
                ));
            }

            UserResponseDTO response = new UserResponseDTO(
                    user.getUser_id(), user.getFullName(), user.getEmail(), user.getPhoneNumber(), user.getRole().name(), user.getCreatedAt(), user.getUpdatedAt(), null
            );

            return ResponseEntity.ok(Map.of(
                    "auth", response,
                    "message", "successful"
            ));
        }catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "message", "internal server error " + e.getMessage()
            ));
        }
    }
}
