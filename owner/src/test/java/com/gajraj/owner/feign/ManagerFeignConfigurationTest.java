package com.gajraj.owner.feign;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import feign.RequestInterceptor;
import static org.junit.jupiter.api.Assertions.*;
class ManagerFeignConfigurationTest {
    @Test void configurationLoadsWithoutBeanNameCollision() {
        try (var context = new AnnotationConfigApplicationContext(ManagerAuthorization.class)) {
            assertNotNull(context.getBean(ManagerAuthorization.class));
            assertEquals(1, context.getBeansOfType(RequestInterceptor.class).size());
            assertNotNull(context.getBean("managerAuthorizationInterceptor", RequestInterceptor.class));
        }
    }
}
