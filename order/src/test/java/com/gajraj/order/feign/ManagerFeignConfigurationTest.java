package com.gajraj.order.feign;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import feign.RequestInterceptor;
import static org.junit.jupiter.api.Assertions.*;
class ManagerFeignConfigurationTest {
    @Test void configurationLoadsWithoutBeanNameCollision() {
        try (var context = new AnnotationConfigApplicationContext(ManagerCredentials.class)) {
            assertNotNull(context.getBean(ManagerCredentials.class));
            assertEquals(1, context.getBeansOfType(RequestInterceptor.class).size());
            assertNotNull(context.getBean("managerServiceTokenInterceptor", RequestInterceptor.class));
        }
    }
}
