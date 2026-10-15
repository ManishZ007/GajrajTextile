package com.gajraj.authentication.service;
import com.gajraj.authentication.dto.register.RegisterRequestDTO;
import com.gajraj.authentication.feign.ConnectionInterfaceForCustomer;
import com.gajraj.authentication.model.Users;
import com.gajraj.authentication.repo.UserRepo;
import com.gajraj.authentication.notify.AuthEmailNotification;
import org.junit.jupiter.api.*;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
class RegistrationTest {
    final UserRepo users=mock(UserRepo.class);
    final ConnectionInterfaceForCustomer customer=mock(ConnectionInterfaceForCustomer.class);
    final AuthEmailNotification notification=mock(AuthEmailNotification.class);
    final AuthService service=new AuthService();
    final RegisterRequestDTO input=new RegisterRequestDTO();
    @BeforeEach void setup(){
        ReflectionTestUtils.setField(service,"userRepo",users);ReflectionTestUtils.setField(service,"customer",customer);ReflectionTestUtils.setField(service,"notification",notification);
        input.setFullName("Test Customer");input.setEmail("test@example.com");input.setPhoneNumber("9876543210");input.setPasswordHash("test-password");input.setRole(Users.Role.CUSTOMER);
        when(users.saveAndFlush(any())).thenAnswer(call->{Users u=call.getArgument(0);u.setUser_id(UUID.randomUUID());return u;});
    }
    @Test void duplicateEmailAndPhoneReturnActionableJsonBeforeSaving(){
        when(users.findByEmail(input.getEmail())).thenReturn(new Users());
        var response=service.register(input);assertEquals(409,response.getStatusCode().value());assertTrue(((Map<?,?>)response.getBody()).get("message").toString().contains("email"));
        when(users.findByEmail(input.getEmail())).thenReturn(null);when(users.findByPhoneNumber(input.getPhoneNumber())).thenReturn(new Users());
        response=service.register(input);assertEquals(409,response.getStatusCode().value());assertTrue(((Map<?,?>)response.getBody()).get("message").toString().contains("phone"));
        verify(users,never()).saveAndFlush(any());verifyNoInteractions(customer);
    }
    @Test void uniqueConstraintRaceAlsoReturnsConflict(){
        when(users.findByPhoneNumber(input.getPhoneNumber())).thenReturn(null,new Users());
        doThrow(new org.springframework.dao.DataIntegrityViolationException("duplicate")).when(users).saveAndFlush(any());
        assertEquals(409,service.register(input).getStatusCode().value());verifyNoInteractions(customer);
    }
    @Test void profileFailureRemovesAuthAccountAndDoesNotSendWelcome(){
        when(customer.saveNewUser(any())).thenThrow(new RuntimeException("Customer database unavailable"));
        assertEquals(502,service.register(input).getStatusCode().value());verify(users).delete(any(Users.class));verifyNoInteractions(notification);
    }
    @Test void falseSuccessWithoutProfileIsRejected(){
        when(customer.saveNewUser(any())).thenReturn(ResponseEntity.ok(Map.of("success",true)));
        assertEquals(502,service.register(input).getStatusCode().value());verify(users).delete(any(Users.class));verifyNoInteractions(notification);
    }
    @Test void validRegistrationHashesPasswordAndReturnsCreated(){
        when(customer.saveNewUser(any())).thenReturn(ResponseEntity.ok(Map.of("customer",Map.of("id","profile"))));
        assertEquals(201,service.register(input).getStatusCode().value());
        verify(users).saveAndFlush(argThat(u->new BCryptPasswordEncoder().matches("test-password",u.getPasswordHash())));
        verify(users,never()).delete(any(Users.class));
    }
    @Test void acceptsClearPasswordNameAndLegacyName() throws Exception {
        var mapper=new com.fasterxml.jackson.databind.ObjectMapper();
        assertEquals("plain",mapper.readValue("{\"password\":\"plain\"}",RegisterRequestDTO.class).getPasswordHash());
        assertEquals("legacy",mapper.readValue("{\"passwordHash\":\"legacy\"}",RegisterRequestDTO.class).getPasswordHash());
    }
}
