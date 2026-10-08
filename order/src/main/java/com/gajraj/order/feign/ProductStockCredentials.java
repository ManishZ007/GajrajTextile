package com.gajraj.order.feign;
import org.springframework.context.annotation.Bean;
import org.springframework.beans.factory.annotation.Value;
import feign.RequestInterceptor;
public class ProductStockCredentials {
    @Bean RequestInterceptor legacyProductStockToken(@Value("${service.internal-token}") String token) {
        return request -> {
            if (request.url().startsWith("/product/variants/decrement-stock/") || request.url().startsWith("/product/variants/increment-stock/"))
                request.header("X-Service-Token", token);
        };
    }
}
