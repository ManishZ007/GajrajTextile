package com.gajraj.payment.config;
import com.gajraj.payment.service.jwtService.JWTService;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.*;
import org.springframework.security.core.context.SecurityContextHolder;
import jakarta.servlet.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
class JWTAuthenticationFilterTest {
    @Test void preflightDoesNotRequireBearerToken() throws Exception {
        var jwt = mock(JWTService.class); var chain = mock(FilterChain.class);
        var req = new MockHttpServletRequest("OPTIONS", "/payment/manager/orders/test");
        req.addHeader("Origin", "http://localhost:3001"); req.addHeader("Access-Control-Request-Method", "GET");
        req.addHeader("Access-Control-Request-Headers", "authorization,content-type");
        var res = new MockHttpServletResponse(); new JWTAuthenticationFilter(jwt).doFilter(req,res,chain);
        verify(chain).doFilter(req,res); verifyNoInteractions(jwt); assertEquals(200,res.getStatus());
    }
    @Test void databaseErrorIsNotReportedAsUnauthorized() throws Exception {
        var jwt = mock(JWTService.class); when(jwt.validationToken("test")).thenReturn(true);
        when(jwt.extractUserId("test")).thenReturn("manager"); when(jwt.extractUserRole("test")).thenReturn("MANAGER");
        var req = new MockHttpServletRequest("GET", "/payment/manager/orders/test"); req.addHeader("Authorization","Bearer test");
        var res = new MockHttpServletResponse(); var chain=mock(FilterChain.class);
        doThrow(new ServletException("Database unavailable")).when(chain).doFilter(req,res);
        try { assertThrows(ServletException.class,()->new JWTAuthenticationFilter(jwt).doFilter(req,res,chain)); assertNotEquals(401,res.getStatus()); }
        finally { SecurityContextHolder.clearContext(); }
    }
}
