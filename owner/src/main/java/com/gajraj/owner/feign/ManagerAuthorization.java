package com.gajraj.owner.feign;
public class ManagerAuthorization {
    @org.springframework.context.annotation.Bean
    public feign.RequestInterceptor managerAuthorizationInterceptor() {
        return template -> {
            var attributes = org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
            if (!(attributes instanceof org.springframework.web.context.request.ServletRequestAttributes request))
                throw new IllegalStateException("Owner authorization is required");
            String header=request.getRequest().getHeader("Authorization");
            if (header==null || !header.startsWith("Bearer ")) throw new IllegalStateException("Owner authorization is required");
            template.header("Authorization", header);
        };
    }
}
