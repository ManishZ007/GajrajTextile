package com.gajraj.payment.config;

import com.gajraj.payment.service.jwtService.JWTService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;

import java.io.IOException;

public class JWTAuthenticationFilter extends org.springframework.web.filter.OncePerRequestFilter  {

    private final JWTService jwtService;

    public JWTAuthenticationFilter(JWTService jwtService) {
        this.jwtService = jwtService;
    }


    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        if (org.springframework.web.cors.CorsUtils.isPreFlightRequest(request)) {
            filterChain.doFilter(request, response);
            return;
        }
        String path = request.getRequestURI();

        if(path.contains("/internal")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = parseJwt(request);

        try {
            if (token == null) {
                sendError(response, HttpServletResponse.SC_UNAUTHORIZED, "Missing or invalid Authorization header");
                return;
            }

            // Validate the token
            if (!jwtService.validationToken(token)) {
                sendError(response, HttpServletResponse.SC_UNAUTHORIZED, "Invalid or expired JWT token");
                return;
            }

            // Extract user details
            String userId = jwtService.extractUserId(token);
            String role = jwtService.extractUserRole(token);
            var authorities = role == null ? java.util.List.<org.springframework.security.core.authority.SimpleGrantedAuthority>of()
                    : java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority(
                            role.startsWith("ROLE_") ? role : "ROLE_" + role));
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(userId, null, authorities);
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);

        } catch (io.jsonwebtoken.ExpiredJwtException ex) {
            sendError(response, HttpServletResponse.SC_UNAUTHORIZED, "Token has expired. Please refresh or log in again.");
            return;
        } catch (io.jsonwebtoken.SignatureException ex) {
            sendError(response, HttpServletResponse.SC_UNAUTHORIZED, "Invalid token signature");
            return;
        } catch (Exception ex) {
            sendError(response, HttpServletResponse.SC_UNAUTHORIZED, "Invalid authentication token");
            return;
        }
        filterChain.doFilter(request, response);
    }

    private void sendError(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.getWriter().write("{\"error\": \"" + message + "\"}");
    }
    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");

        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);
        }

        return null;
    }
}
