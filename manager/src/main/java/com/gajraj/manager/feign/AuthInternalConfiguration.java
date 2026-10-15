package com.gajraj.manager.feign;

// Scoped to the authentication Feign client; not a global component.
public class AuthInternalConfiguration {
    @org.springframework.context.annotation.Bean
    public feign.RequestInterceptor authenticationInternalToken(
        @org.springframework.beans.factory.annotation.Value("${SERVICE_INTERNAL_TOKEN:}") String token) {
        return template -> {
            if(template.url().startsWith("/auth/getUserInfo") && !token.isBlank())
                template.header("X-Service-Token",token);
        };
    }
}