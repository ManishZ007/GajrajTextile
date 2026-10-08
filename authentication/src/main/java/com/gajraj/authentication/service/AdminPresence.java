package com.gajraj.authentication.service;
import org.springframework.stereotype.Service;
import org.springframework.data.redis.core.StringRedisTemplate;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
@Service
public class AdminPresence {
    private final StringRedisTemplate redis;
    public AdminPresence(StringRedisTemplate redis) { this.redis=redis; }
    public void touch(String id) { redis.opsForValue().set("admin:presence:"+id, Instant.now().toString(), Duration.ofSeconds(120)); }
    public void leave(String id) { redis.delete("admin:presence:"+id); }
    public Map<String,Object> read(String id) {
        try {
            String last=redis.opsForValue().get("admin:presence:"+id);
            return Map.of("status",last==null ? "INACTIVE" : "ACTIVE", "lastSeen",last==null ? "" : last);
        } catch (RuntimeException e) { return Map.of("status","UNAVAILABLE","lastSeen",""); }
    }
}
