package com.gajraj.worker.controllers;
import com.gajraj.worker.config.Security;
import com.gajraj.worker.service.jwtService.JWTService;
import org.junit.jupiter.api.*;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
@SpringJUnitWebConfig(ReservationWorkerAccessTest.Config.class)
class ReservationWorkerAccessTest {
    @Configuration @EnableWebMvc @Import({Security.class,Endpoint.class})
    static class Config { @Bean JWTService jwt(){return mock(JWTService.class);} }
    @RestController static class Endpoint { @GetMapping({"/getWorker","/manger-worker/all"}) public String data(){return "ok";} }
    @Autowired WebApplicationContext context;
    @Autowired JWTService jwt;
    @Test void workerProfilesAndSelectionRequireStaffIdentity() throws Exception {
        MockMvc mvc=MockMvcBuilders.webAppContextSetup(context).addFilters(context.getBean(FilterChainProxy.class)).build();
        for(String path:new String[]{"/getWorker","/manger-worker/all"}) {
            mvc.perform(get(path)).andExpect(status().isUnauthorized());
            for(String role:new String[]{"CUSTOMER","MANAGER","OWNER"}) {
                when(jwt.validationToken(role)).thenReturn(true);when(jwt.extractUserId(role)).thenReturn(role);when(jwt.extractUserRole(role)).thenReturn(role);
                mvc.perform(get(path).header("Authorization","Bearer "+role)).andExpect("CUSTOMER".equals(role)?status().isForbidden():status().isOk());
            }
        }
    }
}
