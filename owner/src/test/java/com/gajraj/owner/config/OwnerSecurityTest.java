package com.gajraj.owner.config;
import com.gajraj.owner.service.jwtService.JWTService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.*;
import org.springframework.test.context.junit.jupiter.web.SpringJUnitWebConfig;
import org.springframework.test.context.TestPropertySource;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.web.bind.annotation.*;
import org.springframework.test.web.servlet.*;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.security.web.FilterChainProxy;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
@TestPropertySource(properties={"manager.internal.auth-token=auth-secret", "manager.internal.order-token=order-secret"})
@SpringJUnitWebConfig(OwnerSecurityTest.Config.class)
class OwnerSecurityTest {
 @Configuration @EnableWebMvc @Import(Security.class) static class Config {
  @Bean JWTService jwt(){return mock(JWTService.class);}
  @Bean Routes routes(){return new Routes();}
 }
 @RestController static class Routes {
  @RequestMapping("/owner/reports/approve/id") String route(){return "ok";}
 }
 @Autowired WebApplicationContext context;
 @Autowired JWTService jwt;
 MockMvc mvc;
 @BeforeEach void setup(){
  reset(jwt);
  for(String role: new String[]{"OWNER","MANAGER","CUSTOMER","WORKER"}) {
   when(jwt.validationToken(role)).thenReturn(true);when(jwt.extractUserId(role)).thenReturn("id");when(jwt.extractUserRole(role)).thenReturn(role);
  }
  mvc=MockMvcBuilders.webAppContextSetup(context).addFilters(context.getBean(FilterChainProxy.class)).build();
 }
 @Test void onlyOwnersCanApprove() throws Exception {
  mvc.perform(put("/owner/reports/approve/id")).andExpect(status().isUnauthorized());
  for(String role:new String[]{"MANAGER","CUSTOMER","WORKER"}) mvc.perform(put("/owner/reports/approve/id").header("Authorization","Bearer "+role)).andExpect(status().isForbidden());
  mvc.perform(put("/owner/reports/approve/id").header("Authorization","Bearer OWNER")).andExpect(status().isOk());
 }
}
