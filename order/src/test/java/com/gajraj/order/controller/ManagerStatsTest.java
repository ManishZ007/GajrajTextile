package com.gajraj.order.controller;
import com.gajraj.order.model.*;
import com.gajraj.order.repo.*;
import com.gajraj.order.feign.PaymentServiceClient;
import org.springframework.data.domain.PageImpl;
import org.junit.jupiter.api.Test;
import java.util.*;
import java.math.BigDecimal;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
import static org.junit.jupiter.api.Assertions.*;
class ManagerStatsTest {
    final ManagerStatsController c=new ManagerStatsController();
    final UUID manager=UUID.randomUUID();
    ManagerStatsTest() {
        c.ordersRepo=mock(OrdersRepo.class);c.dealerOrderRepo=mock(DealerOrderRepo.class);
        c.dealerRepo=mock(DealerRepo.class);c.payments=mock(PaymentServiceClient.class);
    }
    Orders retail(String method,Orders.OrderStatus status) {
        var o=new Orders();o.setId(UUID.randomUUID());o.setOrderNumber("C");o.setOrderStatus(status);
        o.setPaymentMethod(method);o.setTotalAmount(new BigDecimal("100.25"));return o;
    }
    DealerOrder bulk(DealerOrder.DealerOrderStatus status) {
        var o=new DealerOrder();o.setId(UUID.randomUUID());o.setOrderNumber("D");o.setStatus(status);
        o.setTotalAmount(new BigDecimal("200.50"));o.setPaidAmount(new BigDecimal("50.25"));return o;
    }
    @Test void includesCustomerAndDealerMoneyButExcludesDraftsAndCancelled() {
        var cod=retail("COD",Orders.OrderStatus.DELIVERED);cod.setCodCollected(true);
        var pending=retail("COD",Orders.OrderStatus.CONFIRMED);
        var cancelled=retail("COD",Orders.OrderStatus.CANCELLED);
        when(c.ordersRepo.findByHandledByManagerIdOrderByOrderDateDesc(eq(manager.toString()),any()))
            .thenReturn(new PageImpl<>(List.of(cod,pending,cancelled)));
        when(c.dealerOrderRepo.findByCreatedByManagerIdOrderByCreatedAtDesc(eq(manager.toString()),any()))
            .thenReturn(new PageImpl<>(List.of(bulk(DealerOrder.DealerOrderStatus.READY),bulk(DealerOrder.DealerOrderStatus.DRAFT))));
        var result=c.getStats(manager,"Bearer owner");
        assertEquals(new BigDecimal("401.00"),result.get("totalOrderValue"));
        assertEquals(new BigDecimal("150.50"),result.get("totalCollected"));
        assertEquals(new BigDecimal("250.50"),result.get("totalBalance"));
        assertEquals(2L,result.get("activeOrders"));assertEquals(1L,result.get("deliveredOrders"));
        verifyNoInteractions(c.payments);
    }
    @Test void onlinePaymentsComeFromPaymentServiceAndOutagesAreNotZero() {
        var online=retail("CARD",Orders.OrderStatus.CONFIRMED);
        when(c.ordersRepo.findByHandledByManagerIdOrderByOrderDateDesc(anyString(),any())).thenReturn(new PageImpl<>(List.of(online)));
        when(c.dealerOrderRepo.findByCreatedByManagerIdOrderByCreatedAtDesc(anyString(),any())).thenReturn(new PageImpl<>(List.of()));
        when(c.payments.summaries(eq("Bearer owner"),any())).thenReturn(Map.of(online.getId().toString(),new PaymentServiceClient.PaymentSummary("PAID","CARD",new BigDecimal("100.25"),"INR")));
        assertEquals(new BigDecimal("100.25"),c.getStats(manager,"Bearer owner").get("totalCollected"));
        when(c.payments.summaries(anyString(),any())).thenThrow(new IllegalStateException());
        var unavailable=c.getStats(manager,"Bearer owner");
        assertEquals(false,unavailable.get("financialAvailable"));assertNull(unavailable.get("totalCollected"));assertNull(unavailable.get("totalBalance"));
        assertEquals(1,((List<?>)unavailable.get("orders")).size());
    }
}
