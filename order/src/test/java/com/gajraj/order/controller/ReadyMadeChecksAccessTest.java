package com.gajraj.order.controller;
import com.gajraj.order.config.Security;
import com.gajraj.order.service.ReadyMadeChecksService;
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

@SpringJUnitWebConfig(ReadyMadeChecksAccessTest.Config.class)
class ReadyMadeChecksAccessTest {
    @Configuration @EnableWebMvc @Import({Security.class, ReadyMadeChecksController.class})
    static class Config {
        @Bean JWTService jwt() { return mock(JWTService.class); }
        @Bean ReadyMadeChecksService checks() { return mock(ReadyMadeChecksService.class); }
    }
    @Autowired WebApplicationContext context;
    @Autowired JWTService jwt;
    @Autowired ReadyMadeChecksService checks;
    MockMvc mvc;
    @BeforeEach void setup() {
        reset(jwt, checks);
        mvc = MockMvcBuilders.webAppContextSetup(context).addFilters(context.getBean(FilterChainProxy.class)).build();
    }
    @Test void customersAndWorkersCannotReadOrChangeChecks() throws Exception {
        var path = "/manager/orders/checks/" + UUID.randomUUID();
        mvc.perform(get("/manager/orders/checks")).andExpect(status().isForbidden());
        for (String role : new String[]{"CUSTOMER", "WORKER"}) {
            token(role);
            mvc.perform(get("/manager/orders/checks").header("Authorization", "Bearer " + role)).andExpect(status().isForbidden());
            mvc.perform(get(path + "/history").header("Authorization", "Bearer " + role)).andExpect(status().isForbidden());
            mvc.perform(post(path).header("Authorization", "Bearer " + role).contentType("application/json").content("{\"action\":\"APPROVE\"}"))
                .andExpect(status().isForbidden());
        }
        verifyNoInteractions(checks);
    }
    @Test void managerAndOwnerActionsUseSignedIdentity() throws Exception {
        var id = UUID.randomUUID();
        for (String role : new String[]{"MANAGER", "OWNER"}) {
            token(role);
            mvc.perform(post("/manager/orders/checks/" + id).header("Authorization", "Bearer " + role)
                .contentType("application/json").content("{\"action\":\"HOLD\",\"note\":\"Inspect packaging\"}"))
                .andExpect(status().isNoContent());
            verify(checks).act(id, "HOLD", "Inspect packaging", role + "-id");
        }
    }
    void token(String role) {
        when(jwt.validationToken(role)).thenReturn(true);
        when(jwt.extractUserId(role)).thenReturn(role + "-id");
        when(jwt.extractUserRole(role)).thenReturn(role);
    }
}
