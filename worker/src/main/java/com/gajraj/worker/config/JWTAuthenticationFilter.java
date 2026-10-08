package com.gajraj.worker.config;


import com.gajraj.worker.service.jwtService.JWTService;
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
        this.jwtService = jwtService;
    }


    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {



        String path = request.getRequestURI();

        if(path.contains("/internal") || (path.contains("/manger-worker") && !path.contains("/verify/")) || path.contains("/getWorker")) {
            filterChain.doFilter(request, response);
            return;
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
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(userId, null, jwtService.extractUserRole(token) == null ? java.util.List.of() : java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + jwtService.extractUserRole(token).replace("ROLE_", ""))));
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);

        }catch (io.jsonwebtoken.ExpiredJwtException ex) {
            sendError(response, HttpServletResponse.SC_UNAUTHORIZED, "Token has expired. Please refresh or log in again.");
            return;
        } catch (io.jsonwebtoken.SignatureException ex) {
            sendError(response, HttpServletResponse.SC_UNAUTHORIZED, "Invalid token signature");
            return;
        } catch (Exception ex) {
            sendError(response, HttpServletResponse.SC_UNAUTHORIZED, "Invalid authentication token");
            return;
        }

        // Application/database failures must keep their real status, not become a 401.
        filterChain.doFilter(request, response);
    }


    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");

        if(StringUtils.hasText(headerAuth) && headerAuth.contains("Bearer ")) {
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
