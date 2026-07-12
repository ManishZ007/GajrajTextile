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
        this.jwtService = jwtService;
    }


    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {



        String path = request.getRequestURI();

        if(path.contains("/internal") || path.contains("/manager")) {
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
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(userId, null, null);
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);

            filterChain.doFilter(request, response);
        }catch (io.jsonwebtoken.ExpiredJwtException ex) {
            sendError(response, HttpServletResponse.SC_UNAUTHORIZED, "Token has expired. Please refresh or log in again.");
        } catch (io.jsonwebtoken.SignatureException ex) {
            sendError(response, HttpServletResponse.SC_UNAUTHORIZED, "Invalid token signature");
        } catch (Exception ex) {
            sendError(response, HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized: " + ex.getMessage());
        }



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
