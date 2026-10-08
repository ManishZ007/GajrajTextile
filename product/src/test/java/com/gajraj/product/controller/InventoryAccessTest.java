package com.gajraj.product.controller;
import com.gajraj.product.config.Security;
import com.gajraj.product.service.StockManagementService;
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
import java.util.UUID;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringJUnitWebConfig(InventoryAccessTest.Config.class)
class InventoryAccessTest {
    @Configuration @EnableWebMvc @Import({Security.class, StockManagementController.class})
    static class Config {
        @Bean JWTService jwt() { return mock(JWTService.class); }

    }
    @Autowired WebApplicationContext context;
    @Autowired JWTService jwt;
    @org.springframework.test.context.bean.override.mockito.MockitoBean StockManagementService checks;
    MockMvc mvc;
    @BeforeEach void setup() {
        reset(jwt, checks);
        mvc = MockMvcBuilders.webAppContextSetup(context).addFilters(context.getBean(FilterChainProxy.class)).build();
    }
    @Test void customersAndWorkersCannotReadOrChangeChecks() throws Exception {
        var path = "/product/inventory/" + UUID.randomUUID();
        mvc.perform(get("/product/inventory/all")).andExpect(status().isForbidden());
        for (String role : new String[]{"CUSTOMER", "WORKER"}) {
            token(role);
            mvc.perform(get("/product/inventory/all").header("Authorization", "Bearer " + role)).andExpect(status().isForbidden());
            mvc.perform(get("/product/inventory/history").header("Authorization", "Bearer " + role)).andExpect(status().isForbidden());
            mvc.perform(put("/product/inventory/update/" + UUID.randomUUID()).header("Authorization", "Bearer " + role).contentType("application/json").content("{\"action\":\"APPROVE\"}"))
                .andExpect(status().isForbidden());
        }
        verifyNoInteractions(checks);
    }
    @Test void managerAndOwnerActionsUseSignedIdentity() throws Exception {
        var id=UUID.randomUUID();
        for(String role:new String[]{"MANAGER","OWNER"}) {
            token(role);
            mvc.perform(put("/product/inventory/update/"+id).header("Authorization","Bearer "+role)
              .contentType("application/json").content("{\"adjustmentAmount\":2,\"reason\":\"Restock\",\"changedBy\":\"forged\"}"))
              .andExpect(status().isOk());
            verify(checks).updateStock(eq(id),argThat(d -> d.getChangedBy().equals(role+"-id")));
        }
    }
    @Test void legacyEditsRejectCustomersAndStockCallbacksRequireServiceToken() throws Exception {
        token("CUSTOMER");
        for(String path:new String[]{"/product/update/", "/product/variants/update/", "/product/variants/decrement-stock/", "/product/variants/increment-stock/"})
            mvc.perform(put(path+UUID.randomUUID()).header("Authorization","Bearer CUSTOMER")).andExpect(status().isForbidden());
        mvc.perform(post("/product/create")).andExpect(status().isForbidden());
        mvc.perform(delete("/product/variants/delete/"+UUID.randomUUID())).andExpect(status().isForbidden());
    }
    void token(String role) {
        when(jwt.validationToken(role)).thenReturn(true);
        when(jwt.extractUserId(role)).thenReturn(role + "-id");
        when(jwt.extractUserRole(role)).thenReturn(role);
    }
}
