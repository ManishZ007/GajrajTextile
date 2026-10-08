package com.gajraj.product.config;


import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;

import java.util.List;

@Configuration
@EnableWebSecurity
public class Security {

    @Bean
    public SecurityFilterChain securityFilterChain (HttpSecurity httpSecurity, com.gajraj.product.service.JwtService.JWTService jwtService, @org.springframework.beans.factory.annotation.Value("${service.internal-token:}") String serviceToken) throws Exception {

        httpSecurity.csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(request -> {
                    CorsConfiguration configuration = new CorsConfiguration();
                    configuration.setAllowedOrigins(List.of("http://localhost:3001"));
                    configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
                    configuration.setAllowedHeaders(List.of("*"));
                    configuration.setAllowCredentials(true);
                    return configuration;
                }))
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS));

        httpSecurity.authorizeHttpRequests(registry -> registry
                .requestMatchers("/product/inventory/**", "/product/create", "/product/update/**", "/product/variants/update/**", "/product/variants/delete/**").hasAnyRole("MANAGER", "OWNER")
                .requestMatchers("/manager/**").permitAll()
                .requestMatchers("/product/**").permitAll()
                .requestMatchers("/products/**").permitAll()
                .requestMatchers("/inventory/**").permitAll()
                .requestMatchers("/padars/**").permitAll()
                .requestMatchers("/borders/**").permitAll()
                .requestMatchers("/buttis/**").permitAll()
                .requestMatchers("/body-colors/**").permitAll()
                .requestMatchers("/border-colors/**").permitAll()
                .requestMatchers("/wishlist/**").permitAll()
                .requestMatchers("/cart/**").permitAll()

        );

        httpSecurity.addFilterBefore(new InventoryAuthenticationFilter(jwtService, serviceToken), UsernamePasswordAuthenticationFilter.class);
        return httpSecurity.build();
    }

}
