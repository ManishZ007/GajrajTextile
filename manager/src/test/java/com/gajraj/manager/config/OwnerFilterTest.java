package com.gajraj.manager.config;
import com.gajraj.manager.service.jwtService.JWTService;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;
class OwnerFilterTest {
    @Test void validOwnerReachesControllerAndServiceErrorsKeepTheirStatus() throws Exception {
        var jwt=mock(JWTService.class);when(jwt.validationToken("owner")).thenReturn(true);
        when(jwt.extractUserId("owner")).thenReturn("id");when(jwt.extractUserRole("owner")).thenReturn("OWNER");
        var filter=new JWTAuthenticationFilter(jwt);
        var request=new MockHttpServletRequest("GET","/owner/managers/id/workers");
        request.addHeader("Authorization","Bearer owner");
        var response=new MockHttpServletResponse();
        try {
            filter.doFilter(request,response,(req,res)->((jakarta.servlet.http.HttpServletResponse)res).setStatus(503));
            assertEquals(503,response.getStatus());
            assertTrue(SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream().anyMatch(a->a.getAuthority().equals("ROLE_OWNER")));
        } finally {SecurityContextHolder.clearContext();}
    }
    @Test void internalManagerProfilesDoNotBypassAuthentication() throws Exception {
        var filter=new JWTAuthenticationFilter(mock(JWTService.class));
        var response=new MockHttpServletResponse();
        filter.doFilter(new MockHttpServletRequest("GET","/internal/managers/id"),response,(req,res)->fail("Unauthenticated request forwarded"));
        assertEquals(401,response.getStatus());
    }
}
