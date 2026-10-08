package com.gajraj.authentication.config;

import com.gajraj.authentication.service.jwtService.JWTService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;

import java.io.IOException;

public class JWTAuthenticationFilter extends org.springframework.web.filter.OncePerRequestFilter  {

    private final JWTService jwtService;

    public JWTAuthenticationFilter(JWTService jwtService) {
        this.jwtService = jwtService;}


    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String token  = parseJwt(request);

        if(token != null && jwtService.validationToken(token)) {
            String userId = jwtService.extractUserId(token);
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(userId, null, java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + jwtService.extractUserRole(token).replace("ROLE_", ""))));
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);

        }

        filterChain.doFilter(request, response);
    }

    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");

        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);
        }

        if (request.getCookies() != null) for (var cookie : request.getCookies())
            if ("access_token".equals(cookie.getName())) return cookie.getValue();
        return null;
    }
}
