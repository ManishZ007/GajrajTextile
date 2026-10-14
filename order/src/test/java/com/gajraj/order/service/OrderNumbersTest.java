package com.gajraj.order.service;
import com.gajraj.order.repo.OrdersRepo;
import com.gajraj.order.model.Orders;
import org.junit.jupiter.api.Test;
import java.time.LocalDateTime;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class OrderNumbersTest {
    OrdersRepo repo=mock(OrdersRepo.class);
    @Test void allocatesEachSeriesUnderLockAndSupportsMoreThanFourDigits() {
        for(String prefix:List.of("ORD","RES","ORES")) {
            when(repo.nextNumber("^"+prefix+"-2026-[0-9]+$")).thenReturn(7L);
            assertEquals(prefix+"-2026-0007",OrderNumbers.next(repo,prefix,2026));
            var sequence=inOrder(repo);sequence.verify(repo).lockNumberSeries("order-number:"+prefix+":2026");
            sequence.verify(repo).nextNumber("^"+prefix+"-2026-[0-9]+$");
        }
        when(repo.nextNumber("^RES-2027-[0-9]+$")).thenReturn(10000L);
        assertEquals("RES-2027-10000",OrderNumbers.next(repo,"RES",2027));
    }
    @Test void migrationChangesOnlyLegacyDisplayNumbersAndIsRepeatable() {
        var legacy=new Orders();var id=UUID.randomUUID();legacy.setId(id);legacy.setOrderNumber("RES-"+UUID.randomUUID());
        legacy.setOrderDate(LocalDateTime.of(2025,12,1,10,0));legacy.setOrderStatus(Orders.OrderStatus.DELIVERED);
        var current=new Orders();current.setOrderNumber("RES-2025-0001");
        when(repo.findByOrderNumberStartingWithOrderByOrderDateAsc("RES-")).thenReturn(List.of(legacy,current));
        when(repo.nextNumber("^RES-2025-[0-9]+$")).thenReturn(2L);
        var migration=new ReservationNumberMigration(repo);migration.run(null);migration.run(null);
        assertEquals("RES-2025-0002",legacy.getOrderNumber());assertEquals(id,legacy.getId());
        assertEquals(Orders.OrderStatus.DELIVERED,legacy.getOrderStatus());assertEquals("RES-2025-0001",current.getOrderNumber());
        verify(repo,times(1)).saveAndFlush(legacy);
    }
    @Test void invalidPrefixCannotReachDatabase() {
        assertThrows(IllegalArgumentException.class,()->OrderNumbers.next(repo,"anything",2026));verifyNoInteractions(repo);
    }
}
