package com.gajraj.order.config;

import com.gajraj.order.service.JwtService.JWTService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
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
        this.jwtService = jwtService;
    }


    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();

        if (path.contains("/internal/") && !path.startsWith("/internal/manager-stats/")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = parseJwt(request);

        if (token == null) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            if (!jwtService.validationToken(token)) {
                sendError(response, HttpServletResponse.SC_UNAUTHORIZED, "Invalid or expired JWT token");
                return;
            }

            String userId = jwtService.extractUserId(token);
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(userId, null,
                            jwtService.extractUserRole(token) == null ? java.util.List.of() : java.util.List.of(
                            new org.springframework.security.core.authority.SimpleGrantedAuthority(
                            jwtService.extractUserRole(token).startsWith("ROLE_") ? jwtService.extractUserRole(token) : "ROLE_" + jwtService.extractUserRole(token))));
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);

        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            sendError(response, HttpServletResponse.SC_UNAUTHORIZED, "Token has expired, please log in again"); return;
        } catch (io.jsonwebtoken.SignatureException e) {
            sendError(response, HttpServletResponse.SC_UNAUTHORIZED, "Invalid token signature"); return;
        } catch (Exception e) {
            sendError(response, HttpServletResponse.SC_UNAUTHORIZED, "Invalid authentication token"); return;
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

        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("access_token".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }

        return null;
    }
}
