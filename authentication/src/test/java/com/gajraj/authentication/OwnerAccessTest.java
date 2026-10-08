package com.gajraj.authentication;
import com.gajraj.authentication.config.Security;
import com.gajraj.authentication.service.jwtService.JWTService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.*;
import org.springframework.test.context.junit.jupiter.web.SpringJUnitWebConfig;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.web.bind.annotation.*;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.security.web.FilterChainProxy;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
@org.springframework.test.context.TestPropertySource(properties="jwt.expiration=900000")
@SpringJUnitWebConfig(OwnerAccessTest.Config.class)
class OwnerAccessTest {
    @Configuration @EnableWebMvc @Import(Security.class)
    static class Config {
        @Bean JWTService jwt() {return mock(JWTService.class);}
        @Bean Routes routes() {return new Routes();}
    }
    @RestController static class Routes {
        @GetMapping("/auth/managers") String list() {return "ok";}
        @GetMapping("/auth/admin/report-staff") String staff() {return "names";}
        @GetMapping("/auth/admin/me") String me() {return "profile";}
    }
    @Autowired WebApplicationContext context;
    @Autowired JWTService jwt;
    MockMvc mvc;
    @BeforeEach void setup() {
        reset(jwt);
        mvc=MockMvcBuilders.webAppContextSetup(context).addFilters(context.getBean(FilterChainProxy.class)).build();
    }
    @Test void unauthenticatedAndManagerCannotReadOwnerManagers() throws Exception {
        mvc.perform(get("/auth/managers")).andExpect(status().isForbidden());
        when(jwt.validationToken("manager")).thenReturn(true);
        when(jwt.extractUserId("manager")).thenReturn("manager-id");
        when(jwt.extractUserRole("manager")).thenReturn("MANAGER");
        mvc.perform(get("/auth/managers").header("Authorization","Bearer manager")).andExpect(status().isForbidden());
    }
    @Test void signedOwnerCanReadManagers() throws Exception {
        when(jwt.validationToken("owner")).thenReturn(true);
        when(jwt.extractUserId("owner")).thenReturn("owner-id");
        when(jwt.extractUserRole("owner")).thenReturn("OWNER");
        mvc.perform(get("/auth/managers").header("Authorization","Bearer owner")).andExpect(status().isOk());
    }

    @Test void customerProfileEnrichmentStillWorks() throws Exception {
        when(jwt.validationToken("customer")).thenReturn(true);
        when(jwt.extractUserId("customer")).thenReturn("customer-id");
        when(jwt.extractUserRole("customer")).thenReturn("CUSTOMER");
        mvc.perform(get("/auth/admin/me").header("Authorization","Bearer customer")).andExpect(status().isOk());
    }
    @Test void reportNamesAreStaffOnly() throws Exception {
        mvc.perform(get("/auth/admin/report-staff")).andExpect(status().isForbidden());
        for(String role: new String[]{"CUSTOMER", "WORKER", "MANAGER", "OWNER"}) {
            when(jwt.validationToken(role)).thenReturn(true);
            when(jwt.extractUserId(role)).thenReturn("id");
            when(jwt.extractUserRole(role)).thenReturn(role);
            mvc.perform(get("/auth/admin/report-staff").header("Authorization", "Bearer " + role))
                .andExpect(role.equals("OWNER") || role.equals("MANAGER") ? status().isOk() : status().isForbidden());
        }
    }
}
