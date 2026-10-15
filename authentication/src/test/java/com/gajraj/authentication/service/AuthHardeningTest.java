package com.gajraj.authentication.service;

import com.gajraj.authentication.controller.AuthController;
import com.gajraj.authentication.feign.ConnectionInterfaceForCustomer;
import com.gajraj.authentication.model.*;
import com.gajraj.authentication.repo.UserRepo;
import com.gajraj.authentication.notify.AuthEmailNotification;
import com.gajraj.authentication.service.jwtService.*;
import org.junit.jupiter.api.*;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AuthHardeningTest {
    final UserRepo users=mock(UserRepo.class);
    final OAuthService oauth=new OAuthService();
    final RefreshTokenService refresh=mock(RefreshTokenService.class);
    final JWTService jwt=mock(JWTService.class);
    final ConnectionInterfaceForCustomer customer=mock(ConnectionInterfaceForCustomer.class);
    @BeforeEach void setup() {
        ReflectionTestUtils.setField(oauth,"userRepo",users);
        ReflectionTestUtils.setField(oauth,"refreshTokenService",refresh);
        ReflectionTestUtils.setField(oauth,"jwtService",jwt);
        ReflectionTestUtils.setField(oauth,"customer",customer);
        ReflectionTestUtils.setField(oauth,"notification",mock(AuthEmailNotification.class));
        ReflectionTestUtils.setField(oauth,"expiration",900000L);
    }
    @AfterEach void cleanup(){SecurityContextHolder.clearContext();}
    ResponseEntity<?> google(String role) {
        return ReflectionTestUtils.invokeMethod(oauth,"upsertAndIssueTokens",Users.AuthProvider.GOOGLE,"google-id","test@example.com",true,"Customer",role);
    }
    @Test void callerCannotCreateStaffViaOAuth() {
        when(users.save(any())).thenAnswer(c->{Users u=c.getArgument(0);u.setUser_id(UUID.randomUUID());return u;});
        when(customer.saveNewUser(any())).thenReturn(ResponseEntity.ok(Map.of("customer",Map.of("id","profile"))));
        RefreshToken token=new RefreshToken();token.setRefreshToken("session");
        when(refresh.createRefreshToken(any())).thenReturn(token);
        assertEquals(200,google("OWNER").getStatusCode().value());
        verify(users).save(argThat(u->u.getRole()==Users.Role.CUSTOMER));
        verify(jwt).generateToken(anyString(),eq("CUSTOMER"));
    }
    @Test void existingPasswordAccountIsNeverConverted() {
        Users u=new Users();u.setRole(Users.Role.OWNER);u.setAuthProvider(Users.AuthProvider.LOCAL);
        when(users.findByEmail("test@example.com")).thenReturn(u);
        assertEquals(409,google("CUSTOMER").getStatusCode().value());
        assertEquals(Users.AuthProvider.LOCAL,u.getAuthProvider());
        verify(users,never()).save(any());verifyNoInteractions(refresh,jwt,customer);
    }
    @Test void existingOAuthStaffCannotUseCustomerLogin() {
        Users u=new Users();u.setRole(Users.Role.MANAGER);
        when(users.findByAuthProviderAndProviderUserId(Users.AuthProvider.GOOGLE,"google-id")).thenReturn(u);
        assertEquals(403,google("CUSTOMER").getStatusCode().value());verifyNoInteractions(refresh,jwt);
    }
    @Test void unknownAndWrongPasswordHaveSameResponseAndStaffAreRejected() {
        AuthService auth=new AuthService();PasswordEncoder encoder=mock(PasswordEncoder.class);
        ReflectionTestUtils.setField(auth,"userRepo",users);ReflectionTestUtils.setField(auth,"passwordEncoder",encoder);
        var unknown=auth.login("test@example.com","bad");
        Users u=new Users();u.setRole(Users.Role.OWNER);u.setPasswordHash("hash");
        when(users.findByEmail("test@example.com")).thenReturn(u);
        var wrong=auth.login("test@example.com","bad");
        assertEquals(401,unknown.getStatusCode().value());assertEquals(unknown.getBody(),wrong.getBody());
        when(encoder.matches("good","hash")).thenReturn(true);
        assertEquals(403,auth.login("test@example.com","good").getStatusCode().value());
    }
    @Test void forwardedIdentityRequiresTrustedProxyCredential() {
        var identity=new AuthClientIdentity();ReflectionTestUtils.setField(identity,"proxyToken","a".repeat(32));
        var request=new MockHttpServletRequest();request.setRemoteAddr("127.0.0.1");
        request.addHeader("X-Auth-Client","browser:123");request.addHeader("X-Forwarded-For","1.2.3.4");
        assertEquals("127.0.0.1",identity.resolve(request));
        request.addHeader("X-Auth-Proxy-Token","a".repeat(32));assertEquals("browser:123",identity.resolve(request));
    }
    @Test void passwordLoginStopsBeforeCheckingCredentialsWhenLimitedOrRedisIsDown() {
        AuthController controller=new AuthController();AuthService service=mock(AuthService.class);
        LoginAttemptLimiter limiter=mock(LoginAttemptLimiter.class);
        ReflectionTestUtils.setField(controller,"authService",service);
        ReflectionTestUtils.setField(controller,"loginLimiter",limiter);
        ReflectionTestUtils.setField(controller,"clientIdentity",new AuthClientIdentity());
        var dto=new com.gajraj.authentication.dto.auth.login.AuthLoginDTO();dto.setEmail("test@example.com");dto.setPassword("password");
        var request=new MockHttpServletRequest();
        when(limiter.allow(anyString(),anyString())).thenReturn(false);
        assertEquals(429,controller.login(dto,request).getStatusCode().value());
        when(limiter.allow(anyString(),anyString())).thenThrow(new IllegalStateException("offline"));
        assertEquals(503,controller.login(dto,request).getStatusCode().value());
        verifyNoInteractions(service);
    }
    @Test void userInfoRejectsSpoofedUserIdAndAcceptsOnlySelfOrInternal() {
        AuthController controller=new AuthController();AuthService service=mock(AuthService.class);
        ReflectionTestUtils.setField(controller,"authService",service);
        ReflectionTestUtils.setField(controller,"internalToken","b".repeat(32));
        String id=UUID.randomUUID().toString();var request=new MockHttpServletRequest();request.addHeader("X-User-Id",id);
        assertEquals(403,controller.userInfo(request).getStatusCode().value());verifyNoInteractions(service);
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(UUID.randomUUID().toString(),null,List.of()));
        assertEquals(403,controller.userInfo(request).getStatusCode().value());
        when(service.userInfo(id)).thenReturn(ResponseEntity.ok().build());
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(id,null,List.of()));
        assertEquals(200,controller.userInfo(request).getStatusCode().value());
        SecurityContextHolder.clearContext();request.addHeader("X-Service-Token","b".repeat(32));
        assertEquals(200,controller.userInfo(request).getStatusCode().value());
    }
}
