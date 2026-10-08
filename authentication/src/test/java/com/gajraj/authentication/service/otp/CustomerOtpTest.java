package com.gajraj.authentication.service.otp;

import com.gajraj.authentication.model.Users;
import com.gajraj.authentication.controller.CustomerOtpController;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import com.gajraj.authentication.repo.UserRepo;
import com.gajraj.authentication.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import java.util.Base64;
import java.util.UUID;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class CustomerOtpTest {
    final UserRepo users=mock(UserRepo.class);
    final OtpStore store=mock(OtpStore.class);
    final OtpPublisher publisher=mock(OtpPublisher.class);
    final CustomerOtpTokens tokens=mock(CustomerOtpTokens.class);
    final OtpCrypto crypto=new OtpCrypto(Base64.getEncoder().encodeToString(new byte[32]), Base64.getEncoder().encodeToString(new byte[32]));
    final CustomerOtpService service=new CustomerOtpService(users,store,crypto,publisher,tokens,true);
    final String phone="9876543210";
    Users user(Users.Role role) {
        Users u=new Users();u.setUser_id(UUID.randomUUID());u.setRole(role);u.setPhoneNumber(phone);return u;
    }
    @Test void normalizesOnlySupportedMobileNumbers() {
        assertEquals(phone,CustomerOtpService.normalizePhone("+91 98765-43210"));
        for(String invalid:new String[]{"1234567890","+19876543210","98765","abc"})
            assertThrows(ResponseStatusException.class,()->CustomerOtpService.normalizePhone(invalid));
    }
    @Test void nonCustomersAndMissingUsersCannotSendOrAuthenticate() {
        when(store.create(anyString(),anyString(),anyString(),anyString(),anyString())).thenReturn(true);
        for(Users.Role role:new Users.Role[]{Users.Role.MANAGER,Users.Role.WORKER,Users.Role.OWNER}) {
            when(users.findByPhoneNumber(phone)).thenReturn(user(role));
            assertEquals(403,assertThrows(ResponseStatusException.class,()->service.request(phone,"local")).getStatusCode().value());
        }
        when(users.findByPhoneNumber(phone)).thenReturn(null);
        assertEquals(404,assertThrows(ResponseStatusException.class,()->service.request(phone,"local")).getStatusCode().value());
        verify(store,times(4)).invalidate(eq(crypto.digest("phone:"+phone)),anyString());
        verifyNoInteractions(publisher,tokens);
        assertThrows(ResponseStatusException.class,()->service.verify(phone,UUID.randomUUID().toString(),"123456"));
        verifyNoInteractions(tokens);
    }
    @Test void unknownNumberReturnsRegistrationErrorWithoutChallenge() throws Exception {
        when(store.create(anyString(),anyString(),anyString(),anyString(),anyString())).thenReturn(true);
        var mvc=MockMvcBuilders.standaloneSetup(new CustomerOtpController(service)).build();
        mvc.perform(post("/auth/customer/otp/request").contentType("application/json")
                .content("{\"phone\":\""+phone+"\"}"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.message").value("This number is not registered. Create an account first."))
            .andExpect(jsonPath("$.challengeId").doesNotExist())
            .andExpect(header().string("Cache-Control","no-store"));
        verifyNoInteractions(publisher,tokens);
    }
    @Test void customerRequestStoresOnlyDigestAndPublishesCodeSeparately() {
        Users u=user(Users.Role.CUSTOMER);when(users.findByPhoneNumber(phone)).thenReturn(u);
        when(store.create(anyString(),anyString(),anyString(),anyString(),anyString())).thenReturn(true);
        var response=service.request(phone,"local");
        verify(store).create(eq(crypto.digest("phone:"+phone)),anyString(),eq((String) response.get("challengeId")),argThat((String d)->d.length()>30),eq(u.getUser_id().toString()));
        verify(publisher).publish(eq((String) response.get("challengeId")),eq(phone),matches("[0-9]{6}"),any());
    }
    @Test void rateLimitAndPublishFailuresFailClosed() {
        when(users.findByPhoneNumber(phone)).thenReturn(user(Users.Role.CUSTOMER));
        assertEquals(429,assertThrows(ResponseStatusException.class,()->service.request(phone,"local")).getStatusCode().value());
        verifyNoInteractions(publisher);
        when(store.create(anyString(),anyString(),anyString(),anyString(),anyString())).thenReturn(true);
        doThrow(new IllegalStateException()).when(publisher).publish(anyString(),anyString(),anyString(),any());
        assertEquals(503,assertThrows(ResponseStatusException.class,()->service.request(phone,"local")).getStatusCode().value());
        verify(store).invalidate(anyString(),anyString());
    }
    @Test void verificationUsesConsumedIdentityAndRejectsReplay() {
        String id=UUID.randomUUID().toString(),uid=UUID.randomUUID().toString();
        when(store.consume(anyString(),eq(id),anyString())).thenReturn(uid,"");
        service.verify(phone,id,"012345");verify(tokens).issue(uid,phone);
        assertThrows(ResponseStatusException.class,()->service.verify(phone,id,"012345"));verifyNoMoreInteractions(tokens);
    }
    @Test void redisOutageAndDisabledFeatureNeverPublishOrIssueTokens() {
        when(users.findByPhoneNumber(phone)).thenReturn(user(Users.Role.CUSTOMER));
        when(store.create(anyString(),anyString(),anyString(),anyString(),anyString())).thenThrow(new IllegalStateException());
        assertThrows(RuntimeException.class,()->service.request(phone,"local"));
        var disabled=new CustomerOtpService(users,store,crypto,publisher,tokens,false);
        assertThrows(ResponseStatusException.class,()->disabled.request(phone,"local"));
        assertThrows(ResponseStatusException.class,()->disabled.verify(phone,UUID.randomUUID().toString(),"123456"));
        verifyNoInteractions(publisher,tokens);
    }
    @Test void roleAndPhoneRecheckedBeforeIssuingTokens() {
        AuthService auth=mock(AuthService.class);var issuer=new CustomerOtpTokens(users,auth);
        for(Users.Role role:new Users.Role[]{Users.Role.MANAGER,Users.Role.WORKER,Users.Role.OWNER}) {
            Users u=user(role);when(users.findForOtpLogin(u.getUser_id())).thenReturn(Optional.of(u));
            assertThrows(ResponseStatusException.class,()->issuer.issue(u.getUser_id().toString(),phone));
        }
        Users changed=user(Users.Role.CUSTOMER);changed.setPhoneNumber("9987654321");
        when(users.findForOtpLogin(changed.getUser_id())).thenReturn(Optional.of(changed));
        assertThrows(ResponseStatusException.class,()->issuer.issue(changed.getUser_id().toString(),phone));
        verifyNoInteractions(auth);
        Users allowed=user(Users.Role.CUSTOMER);when(users.findForOtpLogin(allowed.getUser_id())).thenReturn(Optional.of(allowed));
        issuer.issue(allowed.getUser_id().toString(),phone);verify(auth).issueLoginTokens(allowed);
    }
}
