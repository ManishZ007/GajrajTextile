package com.gajraj.order.service;
import com.gajraj.order.repo.OrdersRepo;
import com.gajraj.order.model.Orders;
import com.gajraj.order.feign.*;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import java.util.*;
import java.math.BigDecimal;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;
class OrderIntegrationServiceTest {
    private final OrdersRepo repo=mock(OrdersRepo.class);
    private final PaymentServiceClient payment=mock(PaymentServiceClient.class);
    private final ManagerServiceClient manager=mock(ManagerServiceClient.class);
    private final OrderIntegrationService service=new OrderIntegrationService(repo,payment,manager,"token");
    private Orders order() {
        Orders o=new Orders();o.setId(UUID.randomUUID());o.setPaymentMethod("COD");o.setUserId("user");
        o.setTotalAmount(new BigDecimal("100.50"));o.setOrderStatus(Orders.OrderStatus.CONFIRMED);o.setIntegrationPending(true);
        when(repo.findForUpdate(o.getId())).thenReturn(Optional.of(o));return o;
    }
    @Test void managerOutageRetainsRetryAndCompletionIsIdempotent() {
        var o=order();when(manager.createOrderFlow(any())).thenThrow(new RuntimeException("Unavailable"));
        assertThrows(RuntimeException.class,()->service.sync(o.getId()));assertTrue(o.getIntegrationPending());
        doReturn(ResponseEntity.ok().build()).when(manager).createOrderFlow(any());
        service.sync(o.getId());service.sync(o.getId());assertFalse(o.getIntegrationPending());
        verify(manager,times(2)).createOrderFlow(any());
    }
    @Test void cancelledCodSyncDoesNotCreateFulfillment() {
        var o=order();o.setOrderStatus(Orders.OrderStatus.CANCELLED);service.sync(o.getId());
        verify(payment).sync(eq(o.getId().toString()),eq("token"),argThat(m->"CANCELLED".equals(m.get("status"))));
        verifyNoInteractions(manager);
    }
    @Test void cashCollectionIsRequiredBeforePaid() {
        var o=order();o.setCodCollected(true);doReturn(ResponseEntity.ok().build()).when(manager).createOrderFlow(any());
        service.sync(o.getId());
        verify(payment).sync(anyString(),anyString(),argThat(m->"PAID".equals(m.get("status"))));
    }
}
