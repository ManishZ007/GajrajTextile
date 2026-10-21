package com.gajraj.product.controller;
import com.gajraj.product.config.Security;
import com.gajraj.product.service.CategoryStudioService;
import com.gajraj.product.service.JwtService.JWTService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.*;
import org.springframework.test.context.junit.jupiter.web.SpringJUnitWebConfig;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.security.web.FilterChainProxy;
import java.util.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringJUnitWebConfig(CategoryStudioAccessTest.Config.class)
class CategoryStudioAccessTest {
    @Configuration @EnableWebMvc @Import({Security.class,CategoryStudioController.class})
    static class Config { @Bean JWTService jwt(){return mock(JWTService.class);} }
    @Autowired WebApplicationContext context;
    @Autowired JWTService jwt;
    @org.springframework.test.context.bean.override.mockito.MockitoBean CategoryStudioService service;
    @Test void studioIsRestrictedToManagerAndOwner() throws Exception {
        MockMvc mvc=MockMvcBuilders.webAppContextSetup(context).addFilters(context.getBean(FilterChainProxy.class)).build();
        String path="/product/categories/"+UUID.randomUUID()+"/studio";
        mvc.perform(get(path)).andExpect(status().isUnauthorized());
        mvc.perform(put(path).contentType("application/json").content("{}" )).andExpect(status().isUnauthorized());
        mvc.perform(get(path).header("Authorization", "Bearer expired")).andExpect(status().isUnauthorized());
        for(String role:List.of("CUSTOMER","WORKER","MANAGER","OWNER")) {
            when(jwt.validationToken(role)).thenReturn(true);when(jwt.extractUserId(role)).thenReturn(UUID.randomUUID().toString());when(jwt.extractUserRole(role)).thenReturn(role);
            boolean allowed=role.equals("MANAGER")||role.equals("OWNER");
            mvc.perform(get(path).header("Authorization","Bearer "+role)).andExpect(allowed?status().isOk():status().isForbidden());
            mvc.perform(put(path).header("Authorization","Bearer "+role).contentType("application/json").content("{\"modelKey\":\"test\",\"regions\":{}}"))
                .andExpect(allowed?status().isOk():status().isForbidden());
        }
    }
}
