package com.gajraj.manager.config;

import com.gajraj.manager.service.jwtService.JWTService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;

import java.util.List;


@Configuration
@EnableWebSecurity
public class Security {


    private final JWTService jwtService;
    @org.springframework.beans.factory.annotation.Value("${manager.internal.auth-token:}")
    private String authToken;
    @org.springframework.beans.factory.annotation.Value("${manager.internal.order-token:}")
    private String orderToken;

    public Security(JWTService jwtService) {
        this.jwtService = jwtService;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity httpSecurity) throws  Exception {

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
                .sessionManagement(AbstractHttpConfigurer::disable);

        httpSecurity.authorizeHttpRequests(registry -> registry
                .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/internal/saveNewUser").hasRole("AUTH_SERVICE")
                .requestMatchers("/internal/order-flow/**").hasRole("ORDER_SERVICE")
                .requestMatchers("/owner/**", "/internal/managers/**",
                    "/manager/price-changes/approve/**", "/manager/reports/approve/**",
                    "/manager/reports/mark-read/**").hasRole("OWNER")
                .requestMatchers("/manager/**").hasAnyRole("MANAGER", "OWNER")
                .anyRequest().denyAll())
                .addFilterBefore(new JWTAuthenticationFilter(jwtService, authToken, orderToken), UsernamePasswordAuthenticationFilter.class);



        return httpSecurity.build();
    }


    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

}
