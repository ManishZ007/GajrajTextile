package com.gajraj.authentication.service;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Runs after Hibernate schema creation; safe to repeat on each startup. */
@Component
public class EmailNormalizationMigration implements ApplicationRunner {
    private final JdbcTemplate jdbc;
    public EmailNormalizationMigration(JdbcTemplate jdbc) { this.jdbc=jdbc; }
    @Override @Transactional
    public void run(ApplicationArguments args) {
        // Serialize startup migration and writes while checking existing identities.
        jdbc.execute("LOCK TABLE users IN SHARE ROW EXCLUSIVE MODE");
        Long collisions=jdbc.queryForObject("SELECT count(*) FROM (SELECT lower(btrim(email)) FROM users GROUP BY lower(btrim(email)) HAVING count(*) > 1) duplicates",Long.class);
        if(collisions!=null && collisions>0)
            throw new IllegalStateException("Email normalization blocked: existing accounts share the same email ignoring case. Resolve these duplicate accounts before restarting Authentication. No accounts were merged or deleted.");
        jdbc.update("UPDATE users SET email=lower(btrim(email)) WHERE email<>lower(btrim(email))");
        jdbc.execute("CREATE UNIQUE INDEX IF NOT EXISTS uk_users_email_normalized ON users (lower(btrim(email)))");
    }
}
