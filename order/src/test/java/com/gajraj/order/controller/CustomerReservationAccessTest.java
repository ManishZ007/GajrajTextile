package com.gajraj.order.controller;
import com.gajraj.order.config.Security;
import com.gajraj.order.service.CustomerReservationService;
import com.gajraj.order.service.JwtService.JWTService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.*;
import org.springframework.test.context.junit.jupiter.web.SpringJUnitWebConfig;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.security.web.FilterChainProxy;
import java.util.UUID;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringJUnitWebConfig(CustomerReservationAccessTest.Config.class)
class CustomerReservationAccessTest {
    @Configuration @EnableWebMvc @Import({Security.class,CustomerReservationController.class})
    static class Config {
        @Bean JWTService jwt() { return mock(JWTService.class); }
        @Bean CustomerReservationService reservations() { return mock(CustomerReservationService.class); }
    }
    @Autowired WebApplicationContext context;
    @Autowired JWTService jwt;
    @Autowired CustomerReservationService service;
    MockMvc mvc;
    @BeforeEach void setup() { reset(jwt,service);mvc=MockMvcBuilders.webAppContextSetup(context).addFilters(context.getBean(FilterChainProxy.class)).build(); }
    @Test void customersCannotApproveThroughEitherUrlAndWorkersCannotRead() throws Exception {
        var id=UUID.randomUUID();
        mvc.perform(get("/reservations/in-stock")).andExpect(status().isForbidden());
        token("CUSTOMER");token("WORKER");
        mvc.perform(get("/reservations/in-stock").header("Authorization","Bearer WORKER")).andExpect(status().isForbidden());
        mvc.perform(get("/manager/reservations/in-stock").header("Authorization","Bearer CUSTOMER")).andExpect(status().isForbidden());
        for(String prefix:new String[]{"/reservations/in-stock/","/manager/reservations/in-stock/"}) {
            mvc.perform(post(prefix+id+"/received-payments").header("Authorization","Bearer CUSTOMER").contentType("application/json").content("{}"))
                .andExpect(status().isForbidden());
            mvc.perform(post(prefix+id+"/confirm").header("Authorization","Bearer CUSTOMER").contentType("application/json").content("{}"))
                .andExpect(status().isForbidden());
            mvc.perform(post(prefix+id+"/payments/"+UUID.randomUUID()+"/review").header("Authorization","Bearer CUSTOMER").contentType("application/json").content("{\"approved\":true,\"amount\":100}"))
                .andExpect(status().isForbidden());
        }
        verifyNoInteractions(service);
    }
    @Test void ownerAndManagerUseSignedIdentity() throws Exception {
        var id=UUID.randomUUID();
        for(String role:new String[]{"MANAGER","OWNER"}) {
            token(role);
            mvc.perform(post("/manager/reservations/in-stock/"+id+"/confirm").header("Authorization","Bearer "+role).contentType("application/json").content("{}"))
                .andExpect(status().isOk());verify(service).confirm(id,role+"-id");
        }
    }
    void token(String role) { when(jwt.validationToken(role)).thenReturn(true);when(jwt.extractUserId(role)).thenReturn(role+"-id");when(jwt.extractUserRole(role)).thenReturn(role); }
}
