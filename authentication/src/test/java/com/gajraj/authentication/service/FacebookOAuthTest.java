package com.gajraj.authentication.service;

import com.gajraj.authentication.feign.ConnectionInterfaceForCustomer;
import com.gajraj.authentication.model.RefreshToken;
import com.gajraj.authentication.model.Users;
import com.gajraj.authentication.notify.AuthEmailNotification;
import com.gajraj.authentication.repo.UserRepo;
import com.gajraj.authentication.service.jwtService.JWTService;
import com.gajraj.authentication.service.jwtService.RefreshTokenService;
import org.junit.jupiter.api.*;
import org.springframework.http.*;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class FacebookOAuthTest {
    OAuthService service;
    MockRestServiceServer meta;
    UserRepo users;
    JWTService jwt;
    RefreshTokenService refresh;
    ConnectionInterfaceForCustomer customer;

    @BeforeEach void setup() {
        service = new OAuthService();
        users = mock(UserRepo.class); jwt = mock(JWTService.class);
        refresh = mock(RefreshTokenService.class); customer = mock(ConnectionInterfaceForCustomer.class);
        ReflectionTestUtils.setField(service, "facebookAppId", "app");
        ReflectionTestUtils.setField(service, "facebookAppSecret", "secret");
        ReflectionTestUtils.setField(service, "userRepo", users);
        ReflectionTestUtils.setField(service, "jwtService", jwt);
        ReflectionTestUtils.setField(service, "refreshTokenService", refresh);
        ReflectionTestUtils.setField(service, "customer", customer);
        ReflectionTestUtils.setField(service, "notification", mock(AuthEmailNotification.class));
        ReflectionTestUtils.setField(service, "expiration", 900000L);
        meta = MockRestServiceServer.bindTo((RestTemplate) ReflectionTestUtils.getField(service, "restTemplate")).build();
    }
    void debug(String json) {
        meta.expect(requestTo("https://graph.facebook.com/debug_token?input_token=test"))
            .andExpect(header("Authorization", "Bearer app|secret"))
            .andRespond(withSuccess(json, MediaType.APPLICATION_JSON));
    }
    void profile(String json) {
        meta.expect(requestTo("https://graph.facebook.com/me?fields=id,name,email"))
            .andExpect(header("Authorization", "Bearer test"))
            .andRespond(withSuccess(json, MediaType.APPLICATION_JSON));
    }
    void valid() { debug("{\"data\":{\"app_id\":\"app\",\"is_valid\":true,\"user_id\":\"fb-user\",\"expires_at\":4102444800}}"); }
    @AfterEach void verifyRequests() { meta.verify(); }

    @Test void createsOnlyCustomerAndNormalizesEmail() {
        valid(); profile("{\"id\":\"fb-user\",\"email\":\" Person@Example.com \",\"name\":\"Person\"}");
        when(users.save(any())).thenAnswer(call -> { Users u=call.getArgument(0); u.setUser_id(UUID.randomUUID()); return u; });
        when(customer.saveNewUser(any())).thenReturn(ResponseEntity.ok(Map.of("customer", Map.of("id", "profile"))));
        RefreshToken token = new RefreshToken(); token.setRefreshToken("refresh");
        when(refresh.createRefreshToken(any())).thenReturn(token);
        assertEquals(200, service.loginWithFacebook("test", "OWNER").getStatusCode().value());
        verify(users).save(argThat(u -> u.getRole()==Users.Role.CUSTOMER && u.getEmail().equals("person@example.com")));
        verify(jwt).generateToken(anyString(), eq("CUSTOMER"));
    }
    @Test void rejectsWrongAppBeforeReadingProfile() {
        debug("{\"data\":{\"app_id\":\"other\",\"is_valid\":true,\"user_id\":\"fb-user\"}}");
        assertEquals(401, service.loginWithFacebook("test", null).getStatusCode().value());
        verifyNoInteractions(users, jwt);
    }
    @Test void rejectsExpiredToken() {
        debug("{\"data\":{\"app_id\":\"app\",\"is_valid\":true,\"user_id\":\"fb-user\",\"expires_at\":1}}");
        assertEquals(401, service.loginWithFacebook("test", null).getStatusCode().value());
        verifyNoInteractions(users, jwt);
    }
    @Test void rejectsMismatchedIdentity() {
        valid(); profile("{\"id\":\"different\",\"email\":\"person@example.com\"}");
        assertEquals(401, service.loginWithFacebook("test", null).getStatusCode().value());
        verifyNoInteractions(users, jwt);
    }
    @Test void missingEmailDoesNotCreateAccount() {
        valid(); profile("{\"id\":\"fb-user\",\"name\":\"Person\"}");
        assertEquals(400, service.loginWithFacebook("test", null).getStatusCode().value());
        verify(users, never()).save(any()); verifyNoInteractions(jwt, refresh, customer);
    }
    @Test void existingPasswordAccountIsNotLinked() {
        valid(); profile("{\"id\":\"fb-user\",\"email\":\"Person@Example.com\"}");
        Users existing = new Users(); existing.setAuthProvider(Users.AuthProvider.LOCAL);
        when(users.findByEmail("person@example.com")).thenReturn(existing);
        assertEquals(409, service.loginWithFacebook("test", null).getStatusCode().value());
        assertEquals(Users.AuthProvider.LOCAL, existing.getAuthProvider());
        verify(users, never()).save(any()); verifyNoInteractions(jwt, refresh);
    }
    @Test void upstreamErrorDoesNotExposeSecretOrToken() {
        meta.expect(requestTo("https://graph.facebook.com/debug_token?input_token=test"))
            .andRespond(withStatus(HttpStatus.BAD_REQUEST).body("sensitive-provider-response"));
        var response = service.loginWithFacebook("test", null);
        assertEquals(401, response.getStatusCode().value());
        assertEquals("Facebook token verification failed", response.getBody());
    }
    @Test void returningFacebookCustomerUsesExistingIdentityWithoutNewProfile() {
        valid(); profile("{\"id\":\"fb-user\",\"name\":\"Person\"}");
        Users existing = new Users(); existing.setUser_id(UUID.randomUUID()); existing.setRole(Users.Role.CUSTOMER);
        when(users.findByAuthProviderAndProviderUserId(Users.AuthProvider.FACEBOOK, "fb-user")).thenReturn(existing);
        RefreshToken token = new RefreshToken(); token.setRefreshToken("refresh");
        when(refresh.createRefreshToken(existing)).thenReturn(token);
        assertEquals(200, service.loginWithFacebook("test", null).getStatusCode().value());
        verify(users, never()).save(any()); verifyNoInteractions(customer);
        verify(jwt).generateToken(existing.getUser_id().toString(), "CUSTOMER");
    }
    @Test void failedCustomerProfileCreationDoesNotIssueTokens() {
        valid(); profile("{\"id\":\"fb-user\",\"email\":\"person@example.com\"}");
        when(users.save(any())).thenAnswer(call -> { Users u=call.getArgument(0); u.setUser_id(UUID.randomUUID()); return u; });
        when(customer.saveNewUser(any())).thenReturn(ResponseEntity.status(500).body(Map.of("success", false)));
        assertEquals(502, service.loginWithFacebook("test", null).getStatusCode().value());
        verify(users).delete(any()); verifyNoInteractions(jwt, refresh);
    }
}
