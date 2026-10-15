package com.gajraj.authentication.service;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Component
public class AuthClientIdentity {
    @Value("${AUTH_PROXY_TOKEN:}") private String proxyToken;
    public String resolve(HttpServletRequest request) {
        String client=request.getHeader("X-Auth-Client");
        if (matches(proxyToken,request.getHeader("X-Auth-Proxy-Token")) && client!=null
            && client.matches("[a-zA-Z0-9:._-]{1,100}")) return client;
        return request.getRemoteAddr();
    }
    public static boolean matches(String expected,String supplied) {
        return expected!=null && expected.length()>=32 && supplied!=null
            && MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8),supplied.getBytes(StandardCharsets.UTF_8));
    }
}
