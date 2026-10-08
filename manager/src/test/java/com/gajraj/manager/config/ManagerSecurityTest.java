package com.gajraj.manager.config;
import com.gajraj.manager.service.jwtService.JWTService;
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
@SpringJUnitWebConfig(ManagerSecurityTest.Config.class)
class ManagerSecurityTest {
 @Configuration @EnableWebMvc @Import(Security.class) static class Config {
  @Bean JWTService jwt(){return mock(JWTService.class);}
  @Bean Routes routes(){return new Routes();}
 }
 @RestController static class Routes {
  @RequestMapping({"/manager/support/all", "/manager/reports/approve/id", "/manager/price-changes/approve/id", "/internal/saveNewUser", "/internal/order-flow/create", "/internal/managers/id", "/internal/unknown"}) String route(){return "ok";}
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
 @Test void managerRoutesRequireStaff() throws Exception {
  mvc.perform(get("/manager/support/all")).andExpect(status().isUnauthorized());
  mvc.perform(get("/manager/support/all").header("Authorization","Bearer invalid")).andExpect(status().isUnauthorized());
  for(String role:new String[]{"CUSTOMER","WORKER"}) mvc.perform(get("/manager/support/all").header("Authorization","Bearer "+role)).andExpect(status().isForbidden());
  for(String role:new String[]{"MANAGER","OWNER"}) mvc.perform(get("/manager/support/all").header("Authorization","Bearer "+role)).andExpect(status().isOk());
 }
 @Test void approvalsRequireOwner() throws Exception {
  for(String path:new String[]{"/manager/reports/approve/id","/manager/price-changes/approve/id"}) {
   mvc.perform(put(path).header("Authorization","Bearer MANAGER")).andExpect(status().isForbidden());
   mvc.perform(put(path).header("Authorization","Bearer OWNER")).andExpect(status().isOk());
  }
 }
 @Test void internalCredentialsAreScoped() throws Exception {
  mvc.perform(post("/internal/saveNewUser")).andExpect(status().isUnauthorized());
  mvc.perform(post("/internal/saveNewUser").header("X-Service-Token","order-secret")).andExpect(status().isUnauthorized());
  mvc.perform(post("/internal/saveNewUser").header("X-Service-Token","auth-secret")).andExpect(status().isOk());
  mvc.perform(post("/internal/order-flow/create").header("X-Service-Token","auth-secret")).andExpect(status().isUnauthorized());
  mvc.perform(post("/internal/order-flow/create").header("X-Service-Token","order-secret")).andExpect(status().isOk());
  mvc.perform(post("/internal/order-flow/create").header("Authorization","Bearer OWNER")).andExpect(status().isUnauthorized());
  mvc.perform(get("/internal/managers/id").header("X-Service-Token","auth-secret")).andExpect(status().isUnauthorized());
  mvc.perform(get("/internal/unknown").header("Authorization","Bearer OWNER")).andExpect(status().isForbidden());
 }
 @Test void corsPreflightWorks() throws Exception {
  mvc.perform(options("/manager/support/all").header("Origin","http://localhost:3001").header("Access-Control-Request-Method","GET").header("Access-Control-Request-Headers","authorization")).andExpect(status().isOk());
 }
}
