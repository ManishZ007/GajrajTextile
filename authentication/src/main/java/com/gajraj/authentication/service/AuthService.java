package com.gajraj.authentication.service;



import com.gajraj.authentication.dto.auth.login.LoginResponseDTO;
import com.gajraj.authentication.dto.refresh_token.RequestRefreshTokenDTO;
import com.gajraj.authentication.dto.refresh_token.ResponseRefreshTokenDTO;
import com.gajraj.authentication.dto.update_user.UpdateUserDTO;
import com.gajraj.authentication.dto.update_user.updateCustomer.UpdateCustomerDTO;
import com.gajraj.authentication.dto.register.RegisterRequestDTO;
import com.gajraj.authentication.dto.register.WorkerRegisterDTO;
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
    public ResponseEntity<?> register(RegisterRequestDTO request)  {
        // Never log registration passwords.
        try{
            if (request == null || request.getEmail() == null || request.getPasswordHash() == null || request.getRole() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Email, password and role are required"));
            }

            if (request.getPasswordHash().length()<8 || request.getPasswordHash().getBytes(java.nio.charset.StandardCharsets.UTF_8).length>72)
                return ResponseEntity.badRequest().body(Map.of("message", "Password must have at least 8 characters and at most 72 UTF-8 bytes"));
            request.setEmail(ContactRules.email(request.getEmail()));
            if(request.getFullName()==null || request.getFullName().isBlank() || request.getFullName().length()>100 || request.getEmail().isBlank() || request.getEmail().length()>150 || !request.getEmail().matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"))
                return ResponseEntity.badRequest().body(Map.of("message","Enter a full name and a valid email address"));
            if(request.getPhoneNumber()!=null) request.setPhoneNumber(request.getPhoneNumber().trim());
            if (request.getPhoneNumber()!=null && request.getPhoneNumber().isBlank()) request.setPhoneNumber(null);
            if(request.getRole()==Users.Role.CUSTOMER) {
                try { request.setPhoneNumber(ContactRules.mobile(request.getPhoneNumber())); }
                catch(IllegalArgumentException e) { return ResponseEntity.badRequest().body(Map.of("message",e.getMessage())); }
            } else if(request.getPhoneNumber()!=null && !request.getPhoneNumber().matches("^[0-9]{10}$"))
                return ResponseEntity.badRequest().body(Map.of("message","Enter a valid 10-digit phone number"));
            if (request.getRole() == Users.Role.WORKER) {
                WorkerRegisterDTO w = request.getWorker();
                if (w == null || w.getWorkExperience() == null || w.getGender() == null
                        || w.getDateOfBirth() == null || w.getManagerId() == null || w.getManagerId().isBlank()) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(Map.of("message", "Worker details and manager ID are required"));
                }
            }

            Users user = request.toUser();

            if(userRepo.findByEmail(user.getEmail()) != null ) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "This email is already registered. Please sign in or use another email."));
            }
            if(user.getPhoneNumber()!=null && userRepo.findByPhoneNumber(user.getPhoneNumber())!=null)
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message","This phone number is already registered. Please sign in or use another number."));

            user.setPasswordHash(encoder.encode(user.getPasswordHash()));

            Users saveUsers;
            try { saveUsers = userRepo.saveAndFlush(user); }
            catch(org.springframework.dao.DataIntegrityViolationException conflict) {
                // The unique constraints also protect concurrent registrations after the checks above.
                if(userRepo.findByEmail(user.getEmail())!=null)
                    return ResponseEntity.status(409).body(Map.of("message","This email is already registered."));
                if(user.getPhoneNumber()!=null && userRepo.findByPhoneNumber(user.getPhoneNumber())!=null)
                    return ResponseEntity.status(409).body(Map.of("message","This phone number is already registered."));
                throw conflict;
            }

            SaveUserReq payload = new SaveUserReq();
            payload.setUser_id(saveUsers.getUser_id().toString());

            ResponseEntity<Map<String, Object>> commonResponse;
            try {
                switch (saveUsers.getRole()) {
                    case CUSTOMER:
                        commonResponse = customer.saveNewUser(payload);
                        break;
                    case WORKER:
                        WorkerRegisterDTO w = request.getWorker();
                        payload.setWorkExperience(w.getWorkExperience());
                        payload.setGender(w.getGender());
                        payload.setDateOfBirth(w.getDateOfBirth());
                        payload.setManagerId(w.getManagerId());
                        commonResponse = worker.savaNewUser(payload);
                        break;
                    case MANAGER:
                        commonResponse = manager.saveNewUser(payload);
                        break;
                    case OWNER:
                        commonResponse = ResponseEntity.ok(Map.of("message", "Owner created"));
                        break;
                    default:
                        userRepo.delete(saveUsers);
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Unsupported role"));
                }
            } catch (Exception e) {
                // downstream service failed — roll back the auth user so we don't leave an orphan
                userRepo.delete(saveUsers);
                e.printStackTrace();
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("message", "Could not create your profile. Please try again shortly."));
            }

            if (commonResponse == null || !commonResponse.getStatusCode().is2xxSuccessful()
                    || (commonResponse.getBody()!=null && Boolean.FALSE.equals(commonResponse.getBody().get("success")))
                    || (saveUsers.getRole()==Users.Role.CUSTOMER && (commonResponse.getBody()==null || commonResponse.getBody().get("customer")==null))) {
                userRepo.delete(saveUsers);
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("message", "Could not create your profile. Please try again shortly."));
            }

            safeSendEmail(() -> notification.sendRegistrationEmail(saveUsers.getEmail(), saveUsers.getFullName(), saveUsers.getRole().toString()));

            UserResponseDTO response = new UserResponseDTO(
                    saveUsers.getUser_id(), saveUsers.getFullName(), saveUsers.getEmail(), saveUsers.getPhoneNumber(), saveUsers.getRole().name(), saveUsers.getCreatedAt(), saveUsers.getUpdatedAt(), commonResponse.getBody()
            );

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Registration is temporarily unavailable. Please try again shortly."));
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

        try{
            Users user = userRepo.findByEmail(ContactRules.email(email));

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

            if(user.getRole()==Users.Role.MANAGER) {
                var accessCheck=checkAdminAccount(user);
                if(accessCheck!=null) return accessCheck;
            }
            return ResponseEntity.ok(issueLoginTokens(user));

        }catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("something went wrong while logging the user");
        }

    }


    // Shared token contract for password and customer OTP login.
    public LoginResponseDTO issueLoginTokens(Users user) {
        LoginResponseDTO response = new LoginResponseDTO();
        RefreshToken existing = refreshTokenRepo.findByUserId(user.getUser_id());
        response.setAccess_token(jwtService.generateToken(user.getUser_id().toString(), user.getRole().name()));
        response.setRefresh_token(existing == null
                ? refreshTokenService.createRefreshToken(user).getRefreshToken()
                : refreshTokenService.updateRefreshToken(user.getUser_id()));
        response.setUser_id(user.getUser_id().toString());
        response.setExpires_in(expiration);
        return response;
    }

//    manager login
    public ResponseEntity<?> adminLogin(String email, String password) {
        LoginResponseDTO loginResponse = new LoginResponseDTO();

        try{
            Users user = userRepo.findByEmail(ContactRules.email(email));

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

            var accessCheck=checkAdminAccount(user);
            if(accessCheck!=null) return accessCheck;

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
                var accessCheck=checkAdminAccount(user);
                if(accessCheck!=null) return accessCheck;
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
            userPayload.setEmail(ContactRules.email(updateUserRequest.getUserInfo().getEmail()));
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
                } else if ("MANAGER".equals(userType)) {
                    // auth-only update; manager service profile update is optional / best-effort
                    updatedCommonResponse = ResponseEntity.ok(java.util.Map.of("message", "manager auth info updated"));
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


    public ResponseEntity<?> deleteUser(UUID user_id) {
        try {
            if (user_id == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("user_id is required");
            }

            Users user = userRepo.findById(user_id).orElse(null);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("user not found");
            }

            Users.Role role = user.getRole();
            try {
                switch (role) {
                    case WORKER:
                        ResponseEntity<Map<String, Object>> workerResp = worker.deleteWorker(user_id.toString());
                        if (workerResp == null || !workerResp.getStatusCode().is2xxSuccessful()) {
                            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                                    .body("worker service rejected the delete");
                        }
                        break;
                    case MANAGER:
                        var servlet=((org.springframework.web.context.request.ServletRequestAttributes)
                            org.springframework.web.context.request.RequestContextHolder.currentRequestAttributes()).getRequest();
                        String authorization=servlet.getHeader("Authorization");
                        if(authorization==null && servlet.getCookies()!=null) for(var cookie:servlet.getCookies())
                            if("access_token".equals(cookie.getName())) authorization="Bearer "+cookie.getValue();
                        var deleted=manager.deleteManager(user_id.toString(),authorization);
                        if(deleted==null || !deleted.getStatusCode().is2xxSuccessful())
                            return ResponseEntity.status(502).body("Manager service rejected deletion");
                        break;
                    case CUSTOMER:
                    case OWNER:
                        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED)
                                .body("delete not implemented for role: " + role);
                    default:
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body("unsupported role: " + role);
                }
            } catch (Exception e) {
                e.printStackTrace();
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                        .body("downstream service call failed for " + role);
            }

            userRepo.delete(user);

            return ResponseEntity.ok(Map.of(
                    "message", "user deleted successfully",
                    "user_id", user_id.toString(),
                    "role", role.name()
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("something went wrong while deleting the user");
        }
    }


    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> changePassword(UUID userId, String newPassword) {
        try {
            Users user = userRepo.findById(userId).orElse(null);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Manager not found");
            }
            user.setPasswordHash(encoder.encode(newPassword));
            user.setUpdatedAt(LocalDateTime.now());
            userRepo.save(user);
            refreshTokenRepo.deleteForPasswordReset(userId);
            return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to update password");
        }
    }

    public ResponseEntity<?> listByRole(String roleName) {
        try {
            Users.Role role = Users.Role.valueOf(roleName);
            java.util.List<Users> users = userRepo.findByRoleOrderByCreatedAtDesc(role);
            java.util.List<UserResponseDTO> result = users.stream()
                    .map(u -> new UserResponseDTO(u.getUser_id(), u.getFullName(), u.getEmail(),
                            u.getPhoneNumber(), u.getRole().name(), u.getCreatedAt(), u.getUpdatedAt(), null))
                    .toList();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("error: " + e.getMessage());
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

    private ResponseEntity<?> checkAdminAccount(Users user) {
        if(user.getRole()!=Users.Role.MANAGER && user.getRole()!=Users.Role.OWNER)
            return ResponseEntity.status(403).body(Map.of("message","Admin access denied"));
        if(user.getRole()==Users.Role.MANAGER) {
            try {
                var result=manager.accountStatus(user.getUser_id().toString(),
                    "Bearer "+jwtService.generateToken(user.getUser_id().toString(),user.getRole().name()));
                if(!Boolean.TRUE.equals(result.get("enabled")))
                    return ResponseEntity.status(403).body(Map.of("message","Manager account is disabled"));
            } catch(Exception e) {
                return ResponseEntity.status(503).body(Map.of("message","Manager account status unavailable"));
            }
        }
        return null;
    }
}
