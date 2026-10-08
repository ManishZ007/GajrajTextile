package com.gajraj.order.feign;
public class ManagerCredentials {
    @org.springframework.context.annotation.Bean
    public feign.RequestInterceptor managerServiceTokenInterceptor(@org.springframework.beans.factory.annotation.Value("${MANAGER_ORDER_TOKEN:}") String token) {
        return request -> {
            if (request.url().startsWith("/internal/order-flow/")) {
                if (token.isBlank()) throw new IllegalStateException("Manager service credential is not configured");
                request.header("X-Service-Token", token);
            }
        };
    }
}
