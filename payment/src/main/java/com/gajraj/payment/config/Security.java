package com.gajraj.payment.config;


import com.gajraj.payment.service.jwtService.JWTService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class Security {

    private final JWTService jwtService;

    public Security(JWTService jwtService){
        this.jwtService = jwtService;
    }


    @Bean
    public SecurityFilterChain securityFilterChain (HttpSecurity httpSecurity) throws Exception {

        httpSecurity.csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(request -> {
                    var config = new org.springframework.web.cors.CorsConfiguration();
                    config.setAllowedOrigins(java.util.List.of("http://localhost:3000", "http://localhost:3001"));
                    config.setAllowedMethods(java.util.List.of("GET", "POST", "OPTIONS"));
                    config.setAllowedHeaders(java.util.List.of("Authorization", "Content-Type"));
                    config.setAllowCredentials(true);
                    return config;
                }))
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS));

        httpSecurity.authorizeHttpRequests(registry -> registry
                        .requestMatchers("/internal/**").permitAll()
                        .requestMatchers("/payment/manager/**").hasAnyRole("MANAGER", "OWNER", "ADMIN")
                        .requestMatchers("/payment/**").permitAll()
                .anyRequest()
                .authenticated())
                .addFilterBefore(new JWTAuthenticationFilter(jwtService), UsernamePasswordAuthenticationFilter.class);

        return httpSecurity.build();

    }

    @Bean
    public PasswordEncoder passwordEncoder () {
        return new BCryptPasswordEncoder(12);
    }


}
