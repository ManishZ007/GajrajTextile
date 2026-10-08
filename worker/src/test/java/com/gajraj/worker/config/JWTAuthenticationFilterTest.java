package com.gajraj.worker.config;
import com.gajraj.worker.service.jwtService.JWTService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
class JWTAuthenticationFilterTest {
    @Test void downstreamFailureIsNotConvertedToUnauthorized() throws Exception {
        var jwt = mock(JWTService.class);
        when(jwt.validationToken("test")).thenReturn(true);
        when(jwt.extractUserId("test")).thenReturn("manager");
        when(jwt.extractUserRole("test")).thenReturn("MANAGER");
        var request = new MockHttpServletRequest("GET", "/manager/profile/workers");
        request.addHeader("Authorization", "Bearer test");
        var response = new MockHttpServletResponse();
        var chain = mock(FilterChain.class);
        doThrow(new ServletException("Database failure")).when(chain).doFilter(request, response);
        try {
            assertThrows(ServletException.class, () -> new JWTAuthenticationFilter(jwt).doFilter(request, response, chain));
            assertNotEquals(401, response.getStatus());
        } finally { SecurityContextHolder.clearContext(); }
    }
}
