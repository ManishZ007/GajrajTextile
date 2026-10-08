package com.gajraj.manager.config;


import com.gajraj.manager.service.jwtService.JWTService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;

import java.io.IOException;

public class JWTAuthenticationFilter extends org.springframework.web.filter.OncePerRequestFilter {

    private final JWTService jwtService;

    public JWTAuthenticationFilter(JWTService jwtService) {
        this(jwtService, "", "");
    }
    private String authToken;
    private String orderToken;
    public JWTAuthenticationFilter(JWTService jwtService, String authToken, String orderToken) {
        this.jwtService = jwtService;
        this.authToken = authToken;
        this.orderToken = orderToken;
    }
    private boolean matches(String expected, String actual) {
        return expected != null && !expected.isBlank() && actual != null &&
            java.security.MessageDigest.isEqual(expected.getBytes(java.nio.charset.StandardCharsets.UTF_8),
                actual.getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }



    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {



        String path = request.getRequestURI();

        if ("OPTIONS".equals(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }
        String expected = null, serviceRole = null;
        if (path.equals("/internal/saveNewUser")) {
            expected = authToken; serviceRole = "AUTH_SERVICE";
        } else if (path.startsWith("/internal/order-flow/")) {
            expected = orderToken; serviceRole = "ORDER_SERVICE";
        }
        if (serviceRole != null) {
            if (!matches(expected, request.getHeader("X-Service-Token"))) {
                sendError(response, 401, "Invalid service credentials"); return;
            }
            SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                serviceRole, null, java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + serviceRole))));
            filterChain.doFilter(request, response); return;
        }

        String token = parseJwt(request);

        try {
            if(token == null) {
                sendError(response, HttpServletResponse.SC_UNAUTHORIZED, "Missing  Authorization");
                return;
            }

            if (!jwtService.validationToken(token)) {
                sendError(response, HttpServletResponse.SC_UNAUTHORIZED, "Invalid or expired JWT token");
                return;
            }

            String userId = jwtService.extractUserId(token);
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(userId, null, java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + jwtService.extractUserRole(token).replace("ROLE_", ""))));
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);

        }catch (io.jsonwebtoken.ExpiredJwtException ex) {
            sendError(response, HttpServletResponse.SC_UNAUTHORIZED, "Token has expired. Please refresh or log in again."); return;
        } catch (io.jsonwebtoken.SignatureException ex) {
            sendError(response, HttpServletResponse.SC_UNAUTHORIZED, "Invalid token signature"); return;
        } catch (Exception ex) {
            sendError(response, HttpServletResponse.SC_UNAUTHORIZED, "Invalid authentication token"); return;
        }



            filterChain.doFilter(request, response);
    }

    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");

        if(StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);
        }
        return null;
    }

    private void sendError(HttpServletResponse response, int status, String message) throws IOException {
            response.setStatus(status);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\": \"" + message + "\"}");

    }


}
