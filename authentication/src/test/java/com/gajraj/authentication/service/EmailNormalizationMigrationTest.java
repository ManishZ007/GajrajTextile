package com.gajraj.authentication.service;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;
class EmailNormalizationMigrationTest {
    @Test void duplicatesStopMigrationWithoutChangingAccounts(){
        var jdbc=mock(JdbcTemplate.class);when(jdbc.queryForObject(anyString(),eq(Long.class))).thenReturn(1L);
        assertThrows(IllegalStateException.class,()->new EmailNormalizationMigration(jdbc).run(null));
        verify(jdbc,never()).update(anyString());verify(jdbc,never()).execute(startsWith("CREATE"));
    }
    @Test void normalizesExistingRowsAndCreatesCaseInsensitiveUniqueness(){
        var jdbc=mock(JdbcTemplate.class);when(jdbc.queryForObject(anyString(),eq(Long.class))).thenReturn(0L);
        new EmailNormalizationMigration(jdbc).run(null);
        var ordered=inOrder(jdbc);ordered.verify(jdbc).execute(startsWith("LOCK TABLE"));
        ordered.verify(jdbc).queryForObject(anyString(),eq(Long.class));
        ordered.verify(jdbc).update(startsWith("UPDATE users"));ordered.verify(jdbc).execute(contains("UNIQUE INDEX IF NOT EXISTS uk_users_email_normalized"));
    }
}
