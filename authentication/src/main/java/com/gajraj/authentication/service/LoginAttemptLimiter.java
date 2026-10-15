package com.gajraj.authentication.service;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Component;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.List;

@Component
public class LoginAttemptLimiter {
    private final StringRedisTemplate redis;
    public LoginAttemptLimiter(StringRedisTemplate redis) { this.redis=redis; }
    private static final DefaultRedisScript<Long> LIMIT=new DefaultRedisScript<>("""
        local a=redis.call('INCR',KEYS[1]); if a==1 then redis.call('EXPIRE',KEYS[1],900) end
        local c=redis.call('INCR',KEYS[2]); if c==1 then redis.call('EXPIRE',KEYS[2],900) end
        if a>10 or c>100 then return 0 end
        return 1
        """,Long.class);
    public boolean allow(String email,String client) {
        return Long.valueOf(1).equals(redis.execute(LIMIT,List.of("auth:login:account:"+digest(email==null?"":email.trim().toLowerCase(java.util.Locale.ROOT)),"auth:login:client:"+digest(client))));
    }
    private static String digest(String value) {
        try {return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));}
        catch(java.security.NoSuchAlgorithmException e) {throw new IllegalStateException(e);}
    }
}
