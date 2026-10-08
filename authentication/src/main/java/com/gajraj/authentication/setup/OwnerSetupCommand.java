package com.gajraj.authentication.setup;

import java.io.Console;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Arrays;
import java.util.UUID;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/** Explicit operator command; deliberately runs before Spring or any web server starts. */
public final class OwnerSetupCommand {
    private OwnerSetupCommand() {}

    public static int run(String[] args) {
        Console console = System.console();
        if (args.length != 1 || console == null) {
            System.err.println("Use --setup-owner alone in an interactive terminal. Password piping and command-line credentials are not supported.");
            return 1;
        }
        char[] password = null;
        char[] confirmation = null;
        try {
            String url = requiredEnvironment("SPRING_DATASOURCE_URL");
            String username = requiredEnvironment("SPRING_DATASOURCE_USERNAME");
            String dbPassword = requiredEnvironment("SPRING_DATASOURCE_PASSWORD");
            if (!url.startsWith("jdbc:postgresql:")) throw new IllegalArgumentException("A PostgreSQL datasource is required.");
            DriverManager.setLoginTimeout(10);
            try (Connection connection = DriverManager.getConnection(url, username, dbPassword)) {
                if (ownerExists(connection)) {
                    console.printf("An owner already exists. Nothing changed.%n");
                    return 2;
                }
                String name = console.readLine("Owner full name: ");
                String email = console.readLine("Owner email: ");
                String phone = console.readLine("Owner phone (10 digits): ");
                password = console.readPassword("Owner password (hidden): ");
                confirmation = console.readPassword("Confirm password (hidden): ");
                if (password == null || confirmation == null || !Arrays.equals(password, confirmation)) {
                    throw new IllegalArgumentException("Passwords do not match or input was cancelled.");
                }
                validate(name, email, phone, password);
                String hash = new BCryptPasswordEncoder(12).encode(new String(password));
                Arrays.fill(password, '\0');
                Arrays.fill(confirmation, '\0');
                if (!createOwner(connection, name.trim(), email.trim(), phone.trim(), hash)) {
                    console.printf("Another owner was created during setup. Nothing changed.%n");
                    return 2;
                }
                console.printf("Initial owner created successfully. Sign in through the manager frontend.%n");
                return 0;
            }
        } catch (IllegalArgumentException e) {
            System.err.println(e.getMessage());
            return 1;
        } catch (SQLException e) {
            // Do not print SQL exceptions: constraint details may contain account data.
            System.err.println("Owner setup failed (SQL state " + e.getSQLState()
                    + "). Check database connectivity, existing Authentication schema, and duplicate email/phone. No account was updated.");
            return 1;
        } finally {
            if (password != null) Arrays.fill(password, '\0');
            if (confirmation != null) Arrays.fill(confirmation, '\0');
        }
    }

    private static String requiredEnvironment(String key) {
        String value = System.getenv(key);
        if (value == null || value.isBlank()) throw new IllegalArgumentException("Required environment variable missing: " + key);
        return value;
    }

    static void validate(String name, String email, String phone, char[] password) {
        if (name == null || name.isBlank() || name.trim().length() > 100)
            throw new IllegalArgumentException("Name must contain 1 to 100 characters.");
        if (email == null || email.trim().length() > 150 || !email.trim().matches("^[^\\s@<>]+@[^\\s@<>]+\\.[^\\s@<>]+$"))
            throw new IllegalArgumentException("A valid email of at most 150 characters is required.");
        if (phone == null || !phone.trim().matches("[0-9]{10}"))
            throw new IllegalArgumentException("Phone must contain exactly 10 digits.");
        if (password == null || password.length < 8 || new String(password).isBlank()
                || new String(password).getBytes(StandardCharsets.UTF_8).length > 72)
            throw new IllegalArgumentException("Password must have at least 8 characters and at most 72 UTF-8 bytes.");
    }

    private static boolean ownerExists(Connection connection) throws SQLException {
        try (var statement = connection.prepareStatement("SELECT 1 FROM users WHERE role = 'OWNER' LIMIT 1");
             var result = statement.executeQuery()) {
            return result.next();
        }
    }

    static boolean createOwner(Connection connection, String name, String email, String phone, String hash) throws SQLException {
        connection.setAutoCommit(false);
        try {
            // Serialize with other initializers AND normal inserts, including an empty table.
            try (var statement = connection.createStatement()) {
                statement.execute("SET LOCAL lock_timeout = '10s'");
                statement.execute("LOCK TABLE users IN SHARE ROW EXCLUSIVE MODE");
            }
            if (ownerExists(connection)) {
                connection.rollback();
                return false;
            }
            try (var statement = connection.prepareStatement("""
                    INSERT INTO users (user_id, full_name, email, phone_number, password_hash,
                                       role, auth_provider, email_verified, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, 'OWNER', 'LOCAL', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    """)) {
                statement.setObject(1, UUID.randomUUID());
                statement.setString(2, name);
                statement.setString(3, email);
                statement.setString(4, phone);
                statement.setString(5, hash);
                statement.executeUpdate();
            }
            connection.commit();
            return true;
        } catch (SQLException e) {
            connection.rollback();
            throw e;
        } finally {
            connection.setAutoCommit(true);
        }
    }
}
