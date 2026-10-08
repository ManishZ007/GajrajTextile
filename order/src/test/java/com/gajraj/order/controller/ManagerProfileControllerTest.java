package com.gajraj.order.controller;

import com.gajraj.order.repo.*;
import com.gajraj.order.model.*;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ManagerProfileControllerTest {
    private final OrdersRepo orders = mock(OrdersRepo.class);
    private final DealerOrderRepo bulk = mock(DealerOrderRepo.class);
    private final ManagerProfileController controller = new ManagerProfileController(orders, bulk);
    private final UsernamePasswordAuthenticationToken principal = new UsernamePasswordAuthenticationToken("manager-1", null);

    @Test void scopesCustomerOrdersToSignedInManager() {
        when(orders.findByHandledByManagerIdOrderByOrderDateDesc("manager-1", PageRequest.of(1, 10))).thenReturn(Page.empty(PageRequest.of(1,10)));
        when(orders.countByHandledByManagerId("manager-1")).thenReturn(14L);
        var result = controller.orders(principal, "customer", 1);
        assertEquals(14, result.customerOrders());
        verify(orders).findByHandledByManagerIdOrderByOrderDateDesc("manager-1", PageRequest.of(1,10));
        verify(bulk).countByCreatedByManagerIdAndStatus("manager-1", DealerOrder.DealerOrderStatus.DELIVERED);
    }
    @Test void returnsBulkOrderLinkIdAndFullCount() {
        var order = new DealerOrder(); order.setId(UUID.randomUUID());
        when(bulk.findByCreatedByManagerIdOrderByCreatedAtDesc("manager-1", PageRequest.of(0,10)))
            .thenReturn(new PageImpl<>(List.of(order), PageRequest.of(0,10), 24));
        var result = controller.orders(principal, "bulk", 0);
        assertEquals(order.getId(), result.items().getFirst().id());
        assertEquals(3, result.totalPages()); assertEquals(24, result.totalElements());
    }
    @Test void rejectsMissingIdentityAndInvalidPagination() {
        assertThrows(ResponseStatusException.class, () -> controller.orders(null, "customer", 0));
        assertThrows(ResponseStatusException.class, () -> controller.orders(principal, "customer", -1));
        assertThrows(ResponseStatusException.class, () -> controller.orders(principal, "other", 0));
        verifyNoInteractions(orders, bulk);
    }
}
