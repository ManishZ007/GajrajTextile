package com.gajraj.authentication.service.otp;

import org.springframework.core.io.ClassPathResource;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Component;
import java.util.List;

@Component
public class OtpStore {
    private final StringRedisTemplate redis;
    private final DefaultRedisScript<Long> create = new DefaultRedisScript<>();
    private final DefaultRedisScript<String> consume = new DefaultRedisScript<>();
    private final DefaultRedisScript<Long> invalidate = new DefaultRedisScript<>(
        "if redis.call('HGET', KEYS[1], 'id') == ARGV[1] then return redis.call('DEL', KEYS[1]) end return 0", Long.class);

    public OtpStore(StringRedisTemplate redis) {
        this.redis = redis;
        create.setLocation(new ClassPathResource("otp/create.lua")); create.setResultType(Long.class);
        consume.setLocation(new ClassPathResource("otp/consume.lua")); consume.setResultType(String.class);
    }
    private String key(String phone) { return "otp:{customer-login}:" + phone; }
    public boolean create(String phone, String client, String id, String digest, String userId) {
        Long result = redis.execute(create, List.of(key(phone), key(phone)+":cooldown", key(phone)+":send-limit", key("client:"+client)), id, digest, userId);
        return Long.valueOf(1).equals(result);
    }
    public String consume(String phone, String id, String digest) {
        return redis.execute(consume, List.of(key(phone), key(phone)+":verify-limit"), id, digest);
    }
    public void invalidate(String phone, String id) {
        redis.execute(invalidate, List.of(key(phone)), id);
    }
}
