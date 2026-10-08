package com.gajraj.authentication.feign;
public class ManagerCredentials {
    @org.springframework.context.annotation.Bean
    public feign.RequestInterceptor managerServiceTokenInterceptor(@org.springframework.beans.factory.annotation.Value("${MANAGER_AUTH_TOKEN:}") String token) {
        return request -> {
            if (request.url().startsWith("/internal/saveNewUser")) {
                if (token.isBlank()) throw new IllegalStateException("Manager service credential is not configured");
                request.header("X-Service-Token", token);
            }
        };
    }
}
