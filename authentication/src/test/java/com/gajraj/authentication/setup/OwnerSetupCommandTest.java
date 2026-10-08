package com.gajraj.authentication.setup;

import java.sql.*;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class OwnerSetupCommandTest {
    @Test void validatesPasswordBytesAndIdentity() {
        assertDoesNotThrow(() -> OwnerSetupCommand.validate("Owner", "owner@example.com", "9876543210", "strong password".toCharArray()));
        assertThrows(IllegalArgumentException.class, () -> OwnerSetupCommand.validate("Owner", "bad email", "9876543210", "password".toCharArray()));
        assertThrows(IllegalArgumentException.class, () -> OwnerSetupCommand.validate("Owner", "owner@example.com", "123", "password".toCharArray()));
        assertThrows(IllegalArgumentException.class, () -> OwnerSetupCommand.validate("Owner", "owner@example.com", "9876543210", "界".repeat(25).toCharArray()));
    }

    private Connection connection(boolean exists) throws SQLException {
        Connection c = mock(Connection.class);
        when(c.createStatement()).thenReturn(mock(Statement.class));
        PreparedStatement check = mock(PreparedStatement.class);
        ResultSet result = mock(ResultSet.class);
        when(c.prepareStatement(startsWith("SELECT"))).thenReturn(check);
        when(check.executeQuery()).thenReturn(result);
        when(result.next()).thenReturn(exists);
        return c;
    }

    @Test void refusesExistingOwnerAfterAcquiringLock() throws SQLException {
        Connection c = connection(true);
        assertFalse(OwnerSetupCommand.createOwner(c,"Owner","owner@example.com","9876543210","hash"));
        var order = inOrder(c, c.createStatement());
        order.verify(c).setAutoCommit(false);
        order.verify(c.createStatement()).execute("SET LOCAL lock_timeout = '10s'");
        order.verify(c.createStatement()).execute("LOCK TABLE users IN SHARE ROW EXCLUSIVE MODE");
        order.verify(c).prepareStatement(startsWith("SELECT"));
        verify(c, never()).prepareStatement(startsWith("INSERT"));
        verify(c).rollback();
        verify(c, never()).commit();
    }

    @Test void insertsAndCommitsOnlyWhenNoOwnerExists() throws SQLException {
        Connection c = connection(false);
        PreparedStatement insert = mock(PreparedStatement.class);
        when(c.prepareStatement(startsWith("INSERT"))).thenReturn(insert);
        assertTrue(OwnerSetupCommand.createOwner(c,"Owner","owner@example.com","9876543210","encoded-password"));
        verify(insert).setString(5,"encoded-password");
        verify(insert).executeUpdate();
        verify(c).commit();
        verify(c, never()).rollback();
    }

    @Test void duplicateIdentityRollsBackWithoutUpdatingAccount() throws SQLException {
        Connection c = connection(false);
        PreparedStatement insert = mock(PreparedStatement.class);
        when(c.prepareStatement(startsWith("INSERT"))).thenReturn(insert);
        when(insert.executeUpdate()).thenThrow(new SQLException("duplicate", "23505"));
        assertThrows(SQLException.class, () -> OwnerSetupCommand.createOwner(c,"Owner","owner@example.com","9876543210","hash"));
        verify(c).rollback();
        verify(c, never()).commit();
        verify(c).setAutoCommit(true);
    }
}
