package com.gajraj.authentication.service.password;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Component;
import java.time.Duration;
import java.util.List;

@Component
public class PasswordResetStore {
    private final StringRedisTemplate redis;
    private final DefaultRedisScript<Long> limit = new DefaultRedisScript<>("""
        if redis.call('EXISTS', KEYS[1]) == 1 then return 0 end
        if tonumber(redis.call('GET', KEYS[2]) or '0') >= 5 then return 0 end
        if tonumber(redis.call('GET', KEYS[3]) or '0') >= 300 then return 0 end
        redis.call('SET', KEYS[1], '1', 'EX', 60)
        for i = 2, 3 do
            if redis.call('INCR', KEYS[i]) == 1 then redis.call('EXPIRE', KEYS[i], 3600) end
        end
        return 1
        """, Long.class);
    private final DefaultRedisScript<String> consume = new DefaultRedisScript<>("""
        local value = redis.call('GET', KEYS[1])
        if value then redis.call('DEL', KEYS[1]) end
        return value
        """, String.class);
    public PasswordResetStore(StringRedisTemplate redis) { this.redis = redis; }
    private String key(String digest) { return "password-reset:{customer}:" + digest; }
    public boolean allow(String emailDigest, String clientDigest) {
        return Long.valueOf(1).equals(redis.execute(limit, List.of(
            key("cooldown:" + emailDigest), key("email:" + emailDigest), key("client:" + clientDigest))));
    }
    public void save(String digest, String identity) {
        redis.opsForValue().set(key("token:" + digest), identity, Duration.ofMinutes(15));
    }
    public String read(String digest) { return redis.opsForValue().get(key("token:" + digest)); }
    public String consume(String digest) { return redis.execute(consume, List.of(key("token:" + digest))); }
    public void delete(String digest) { redis.delete(key("token:" + digest)); }
}
