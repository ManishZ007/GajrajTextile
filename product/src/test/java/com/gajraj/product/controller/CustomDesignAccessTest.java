package com.gajraj.product.controller;
import com.gajraj.product.config.Security;
import com.gajraj.product.service.CustomDesignRequestService;
import com.gajraj.product.service.JwtService.JWTService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.*;
import org.springframework.test.context.junit.jupiter.web.SpringJUnitWebConfig;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.security.web.FilterChainProxy;
import java.util.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringJUnitWebConfig(CustomDesignAccessTest.Config.class)
class CustomDesignAccessTest {
    @Configuration @EnableWebMvc @Import({Security.class,CustomDesignRequestController.class})
    static class Config { @Bean JWTService jwt(){return mock(JWTService.class);} }
    @Autowired WebApplicationContext context;
    @Autowired JWTService jwt;
    @org.springframework.test.context.bean.override.mockito.MockitoBean CustomDesignRequestService service;
    @Test void roleBoundariesAndIdentityComeFromSignedToken() throws Exception {
        var mvc=MockMvcBuilders.webAppContextSetup(context).addFilters(context.getBean(FilterChainProxy.class)).build();
        String path="/product/design-requests";
        mvc.perform(get(path)).andExpect(status().isUnauthorized());
        for(String role:List.of("CUSTOMER","WORKER","MANAGER","OWNER")){
            when(jwt.validationToken(role)).thenReturn(true);when(jwt.extractUserId(role)).thenReturn(role+"-signed");
            when(jwt.extractUserRole(role)).thenReturn(role);
            mvc.perform(get(path).header("Authorization","Bearer "+role)).andExpect(role.equals("WORKER")?status().isForbidden():status().isOk());
            mvc.perform(post(path).header("Authorization","Bearer "+role).contentType("application/json").content("{}"))
                .andExpect(role.equals("CUSTOMER")?status().isOk():status().isForbidden());
            mvc.perform(put(path+"/"+UUID.randomUUID()+"/quote").header("Authorization","Bearer "+role).contentType("application/json").content("{}"))
                .andExpect(role.equals("MANAGER")||role.equals("OWNER")?status().isOk():status().isForbidden());
        }
        verify(service).list("CUSTOMER-signed",false,0);
        verify(service).submit(any(),eq("CUSTOMER-signed"));
        verify(service,never()).list(eq("WORKER-signed"),anyBoolean(),anyInt());
    }
}
