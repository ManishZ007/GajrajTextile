package com.gajraj.authentication.service;

import com.gajraj.authentication.dto.auth.login.LoginResponseDTO;
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
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.Map;

@Service
public class OAuthService {

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private RefreshTokenRepo refreshTokenRepo;

    @Autowired
    private JWTService jwtService;

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Autowired
    private ConnectionInterfaceForCustomer customer;

    @Autowired
    private ConnectionInterfaceForWorker worker;

    @Autowired
    private ConnectionInterfaceForManager manager;

    @Autowired
    AuthEmailNotification notification;

    @Value("${oauth.google.client-id:}")
    private String googleClientId;

    @Value("${oauth.facebook.app-id:}")
    private String facebookAppId;

    @Value("${oauth.facebook.app-secret:}")
    private String facebookAppSecret;

    @Value("${jwt.expiration}")
    private Long expiration;

    private GoogleIdTokenVerifier googleVerifier;
    private final RestTemplate restTemplate = new RestTemplate();

    @PostConstruct
    void init() {
        if (googleClientId != null && !googleClientId.isBlank()) {
            googleVerifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();
        }
    }

    // ----------------- Google -----------------
    public ResponseEntity<?> loginWithGoogle(String idToken, String roleHint) {
        if (idToken == null || idToken.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("idToken is required");
        }
        if (googleVerifier == null) {
            System.out.println("verifier null");
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body("Google OAuth is not configured");
        }

        GoogleIdToken.Payload payload;
        try {
            GoogleIdToken token = googleVerifier.verify(idToken);
            if (token == null) {
                System.out.println("token is null");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("invalid Google ID token");
            }
            payload = token.getPayload();
            System.out.println(payload);
        } catch (Exception e) {
            System.out.println("google token verification failed");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Google token verification failed: " + e.getMessage());
        }

        String providerUserId = payload.getSubject();
        String email = payload.getEmail();
        boolean emailVerified = Boolean.TRUE.equals(payload.getEmailVerified());
        String fullName = (String) payload.get("name");

        System.out.println(providerUserId + " " + email + " " + emailVerified + " " + fullName);
        return upsertAndIssueTokens(Users.AuthProvider.GOOGLE, providerUserId, email, emailVerified, fullName, roleHint);
    }

    // ----------------- Facebook -----------------
    public ResponseEntity<?> loginWithFacebook(String accessToken, String roleHint) {
        if (accessToken == null || accessToken.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("accessToken is required");
        }
        if (facebookAppId == null || facebookAppId.isBlank() || facebookAppSecret == null || facebookAppSecret.isBlank()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body("Facebook OAuth is not configured");
        }

        // Step 1: confirm the token was issued for THIS app via debug_token.
        try {
            String appAccessToken = facebookAppId + "|" + facebookAppSecret;
            String debugUrl = "https://graph.facebook.com/debug_token?input_token=" + accessToken
                    + "&access_token=" + appAccessToken;
            Map<String, Object> debugResp = restTemplate.getForObject(debugUrl, Map.class);
            if (debugResp == null || !(debugResp.get("data") instanceof Map<?, ?> data)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Facebook token introspection failed");
            }
            Object tokenAppId = data.get("app_id");
            Object isValid = data.get("is_valid");
            if (!facebookAppId.equals(String.valueOf(tokenAppId)) || !Boolean.TRUE.equals(isValid)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Facebook token is not valid for this app");
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Facebook token verification failed: " + e.getMessage());
        }

        // Step 2: fetch profile.
        String providerUserId;
        String email;
        String fullName;
        try {
            String meUrl = "https://graph.facebook.com/me?fields=id,name,email&access_token=" + accessToken;
            Map<String, Object> me = restTemplate.getForObject(meUrl, Map.class);
            if (me == null || me.get("id") == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Could not fetch Facebook profile");
            }
            providerUserId = String.valueOf(me.get("id"));
            email = (String) me.get("email"); // can be null if user denied email scope
            fullName = (String) me.get("name");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body("Facebook profile fetch failed: " + e.getMessage());
        }

        // Facebook emails come pre-verified by Facebook when present.
        return upsertAndIssueTokens(Users.AuthProvider.FACEBOOK, providerUserId, email, email != null, fullName, roleHint);
    }

    // ----------------- shared upsert + token issuance -----------------
    private ResponseEntity<?> upsertAndIssueTokens(Users.AuthProvider provider, String providerUserId,
                                                   String email, boolean emailVerified,
                                                   String fullName, String roleHint) {
        try {
            // Existing OAuth user with this provider identity?
            Users user = userRepo.findByAuthProviderAndProviderUserId(provider, providerUserId);

            // Otherwise, try to link by email
            if (user == null && email != null && emailVerified) {
                Users byEmail = userRepo.findByEmail(email);
                if (byEmail != null) {
                    if (byEmail.getAuthProvider() != Users.AuthProvider.LOCAL
                            && byEmail.getAuthProvider() != provider) {
                        return ResponseEntity.status(HttpStatus.CONFLICT)
                                .body("email is already linked to a different sign-in provider");
                    }
                    byEmail.setAuthProvider(provider);
                    byEmail.setProviderUserId(providerUserId);
                    byEmail.setEmailVerified(true);
                    user = userRepo.save(byEmail);
                }
            }

            // Brand new user
            if (user == null) {
                if (email == null) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body("provider did not return an email; cannot create account");
                }
                if (userRepo.findByEmail(email) != null) {
                    return ResponseEntity.status(HttpStatus.CONFLICT)
                            .body("email already registered; please sign in with that method first");
                }

                Users.Role role;
                try {
                    role = (roleHint == null || roleHint.isBlank())
                            ? Users.Role.CUSTOMER
                            : Users.Role.valueOf(roleHint);
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("invalid role: " + roleHint);
                }

                Users fresh = new Users();
                fresh.setEmail(email);
                fresh.setFullName(fullName != null ? fullName : email);
                fresh.setRole(role);
                fresh.setAuthProvider(provider);
                fresh.setProviderUserId(providerUserId);
                fresh.setEmailVerified(emailVerified);
                // passwordHash and phoneNumber stay null — user can fill them later via updateUser.
                Users saved = userRepo.save(fresh);

                //do email notification



                // Notify downstream service
                try {
                    SaveUserReq req = new SaveUserReq();
                    req.setUser_id(saved.getUser_id().toString());

                    ResponseEntity<Map<String, Object>> downstream = switch (role) {
                        case CUSTOMER -> {
                            safeSendEmail(() -> notification.sendRegistrationEmailToCustomer(saved.getEmail(), saved.getFullName()));
                            yield  customer.saveNewUser(req);
                        }
                        case WORKER -> worker.savaNewUser(req);
                        case MANAGER -> manager.saveNewUser(req);
                        case OWNER -> {
                            System.out.println("Not created");
                            yield ResponseEntity.badRequest().body(Map.of("message", "Owner creation not allowed"));
                        }
                        default -> null;
                    };
                    if (downstream == null || !downstream.getStatusCode().is2xxSuccessful()) {
                        userRepo.delete(saved);
                        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                                .body("downstream service rejected the new OAuth user");
                    }
                } catch (Exception e) {
                    userRepo.delete(saved);
                    e.printStackTrace();
                    return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                            .body("downstream service failed during OAuth signup");
                }
                user = saved;
            }

            // Issue tokens
            String accessToken = jwtService.generateToken(user.getUser_id().toString(), user.getRole().name());
            RefreshToken existing = refreshTokenRepo.findByUserId(user.getUser_id());
            String refreshToken = (existing == null)
                    ? refreshTokenService.createRefreshToken(user).getRefreshToken()
                    : refreshTokenService.updateRefreshToken(user.getUser_id());

            LoginResponseDTO body = new LoginResponseDTO();
            body.setAccess_token(accessToken);
            body.setRefresh_token(refreshToken);
            body.setUser_id(user.getUser_id().toString());
            body.setExpires_in(expiration);
            return ResponseEntity.ok(body);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("something went wrong during OAuth login");
        }
    }


    private void safeSendEmail(Runnable send) {
        try {
            send.run();
        }catch (Exception e) {
            System.out.println("Email sending failed: " + e.getMessage());
        }
    }
}
