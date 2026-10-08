package com.gajraj.authentication.service.password;

import com.gajraj.authentication.controller.CustomerPasswordResetController;
import com.gajraj.authentication.model.Users;
import com.gajraj.authentication.notify.PasswordResetNotification;
import com.gajraj.authentication.repo.UserRepo;
import com.gajraj.authentication.repo.RefreshTokenRepo;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.util.UUID;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class CustomerPasswordResetTest {
    final UserRepo users=mock(UserRepo.class);
    final PasswordResetStore store=mock(PasswordResetStore.class);
    final PasswordResetNotification mail=mock(PasswordResetNotification.class);
    final PasswordResetWriter writer=mock(PasswordResetWriter.class);
    final CustomerPasswordResetService service=new CustomerPasswordResetService(users,store,mail,writer,"http://localhost:3000");
    final String token="a".repeat(43);
    Users customer() {
        Users u=new Users(); u.setUser_id(UUID.randomUUID()); u.setEmail("test@example.com");
        u.setFullName("Test Customer");u.setPasswordHash("old-hash");u.setRole(Users.Role.CUSTOMER);
        return u;
    }
    @Test void requestStoresOnlyDigestAndEmailsRandomLink() {
        Users user=customer();
        when(users.findByEmail(user.getEmail())).thenReturn(user);
        when(store.allow(anyString(),anyString())).thenReturn(true);
        service.request(user.getEmail(),"local");
        var link=ArgumentCaptor.forClass(String.class);
        verify(mail).send(eq(user.getEmail()),eq(user.getFullName()),link.capture());
        String raw=link.getValue().split("#token=")[1];
        assertTrue(raw.matches("[A-Za-z0-9_-]{43}"));
        verify(store).save(eq(CustomerPasswordResetService.digest(raw)),eq(CustomerPasswordResetService.identity(user)));
        assertNotEquals(raw,CustomerPasswordResetService.digest(raw));
    }
    @Test void unknownStaffAndSocialAccountsNeverReceiveResetMail() {
        when(store.allow(anyString(),anyString())).thenReturn(true);
        service.request("missing@example.com","local");
        for (Users.Role role: new Users.Role[]{Users.Role.MANAGER,Users.Role.WORKER,Users.Role.OWNER}) {
            Users user=customer();user.setRole(role);when(users.findByEmail(user.getEmail())).thenReturn(user);
            service.request(user.getEmail(),"local");
        }
        for (Users.AuthProvider provider: new Users.AuthProvider[]{Users.AuthProvider.GOOGLE,Users.AuthProvider.FACEBOOK}) {
            Users user=customer();user.setAuthProvider(provider);when(users.findByEmail(user.getEmail())).thenReturn(user);
            service.request(user.getEmail(),"local");
        }
        verifyNoInteractions(mail,writer);verify(store,never()).save(anyString(),anyString());
    }
    @Test void throttlingAndQueueFailureFailClosed() {
        Users user=customer();when(users.findByEmail(user.getEmail())).thenReturn(user);
        assertEquals(429,assertThrows(ResponseStatusException.class,()->service.request(user.getEmail(),"local")).getStatusCode().value());
        verifyNoInteractions(mail);
        when(store.allow(anyString(),anyString())).thenReturn(true);
        doThrow(new IllegalStateException()).when(mail).send(anyString(),anyString(),anyString());
        assertEquals(503,assertThrows(ResponseStatusException.class,()->service.request(user.getEmail(),"local")).getStatusCode().value());
        verify(store).delete(anyString());
    }
    @Test void validationIsNonConsumingAndRejectsExpiredChangedOrInvalidLinks() {
        assertThrows(ResponseStatusException.class,()->service.validate("wrong"));
        assertThrows(ResponseStatusException.class,()->service.validate(token));
        Users user=customer();String identity=CustomerPasswordResetService.identity(user);
        when(store.read(CustomerPasswordResetService.digest(token))).thenReturn(identity);
        when(users.findById(user.getUser_id())).thenReturn(Optional.of(user));
        service.validate(token);service.validate(token);
        verify(store,never()).consume(anyString());
        user.setPasswordHash("new-hash");
        assertThrows(ResponseStatusException.class,()->service.validate(token));
    }
    @Test void resetChecksPasswordBeforeConsumeAndRejectsReuse() {
        assertThrows(ResponseStatusException.class,()->service.reset(token,"short"));
        assertThrows(ResponseStatusException.class,()->service.reset(token,"é".repeat(40)));
        verifyNoInteractions(store,writer);
        String identity=CustomerPasswordResetService.identity(customer());
        when(store.consume(CustomerPasswordResetService.digest(token))).thenReturn(identity,null);
        service.reset(token,"new-password");
        verify(writer).update(identity,"new-password");
        assertThrows(ResponseStatusException.class,()->service.reset(token,"other-password"));
        verifyNoMoreInteractions(writer);
    }
    @Test void writerEncodesPasswordAndRevokesRefreshTokensAndInvalidatesOtherLinks() {
        Users user=customer();String identity=CustomerPasswordResetService.identity(user);
        when(users.findForOtpLogin(user.getUser_id())).thenReturn(Optional.of(user));
        var refresh=mock(RefreshTokenRepo.class);var encoder=new BCryptPasswordEncoder(4);
        var actualWriter=new PasswordResetWriter(users,refresh,encoder);
        actualWriter.update(identity,"new-password");
        assertTrue(encoder.matches("new-password",user.getPasswordHash()));
        assertFalse(encoder.matches("old-password",user.getPasswordHash()));
        verify(refresh).deleteForPasswordReset(user.getUser_id());
        assertThrows(ResponseStatusException.class,()->actualWriter.update(identity,"another-password"));
    }
    @Test void writerRechecksCustomerRoleAndEmailUnderLock() {
        for (boolean changeRole: new boolean[]{true,false}) {
            Users user=customer();String identity=CustomerPasswordResetService.identity(user);
            if(changeRole) user.setRole(Users.Role.MANAGER);else user.setEmail("other@example.com");
            when(users.findForOtpLogin(user.getUser_id())).thenReturn(Optional.of(user));
            var refresh=mock(RefreshTokenRepo.class);
            assertThrows(ResponseStatusException.class,()->new PasswordResetWriter(users,refresh,new BCryptPasswordEncoder(4)).update(identity,"new-password"));
            verifyNoInteractions(refresh);
        }
        verify(users,never()).save(any());
    }
    @Test void invalidLinkApiReturnsNoPasswordFormAuthorization() throws Exception {
        var mvc=MockMvcBuilders.standaloneSetup(new CustomerPasswordResetController(service)).build();
        mvc.perform(post("/auth/customer/password-reset/validate").contentType("application/json")
            .content("{\"token\":\""+token+"\"}"))
            .andExpect(status().isBadRequest()).andExpect(header().string("Cache-Control","no-store"))
            .andExpect(jsonPath("$.message").value("This reset link is invalid or expired. Request a new link."));
    }
    @Test void invalidEmailAndUntrustedFrontendAreRejected() {
        for(String email:new String[]{"bad","a\n@example.com","a@example.com\nBcc:other@example.com"})
            assertThrows(ResponseStatusException.class,()->service.request(email,"local"));
        verifyNoInteractions(store,mail);
        assertThrows(IllegalArgumentException.class,()->new CustomerPasswordResetService(users,store,mail,writer,"http://evil.example"));
    }
}
