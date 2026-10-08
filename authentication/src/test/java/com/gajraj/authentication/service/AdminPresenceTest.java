package com.gajraj.authentication.service;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import java.time.Duration;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
import static org.junit.jupiter.api.Assertions.*;
class AdminPresenceTest {
    @Test @SuppressWarnings("unchecked") void heartbeatExpiresAndLogoutClearsPresence() {
        var redis=mock(StringRedisTemplate.class);
        ValueOperations<String,String> values=mock(ValueOperations.class);
        when(redis.opsForValue()).thenReturn(values);
        var presence=new AdminPresence(redis);
        presence.touch("manager");
        verify(values).set(eq("admin:presence:manager"),anyString(),eq(Duration.ofSeconds(120)));
        when(values.get("admin:presence:manager")).thenReturn("now",null);
        assertEquals("ACTIVE",presence.read("manager").get("status"));
        assertEquals("INACTIVE",presence.read("manager").get("status"));
        presence.leave("manager");verify(redis).delete("admin:presence:manager");
        when(values.get(anyString())).thenThrow(new IllegalStateException());
        assertEquals("UNAVAILABLE",presence.read("manager").get("status"));
    }
}
