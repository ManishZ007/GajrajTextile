package com.gajraj.order.service;

import com.gajraj.order.feign.ManagerServiceClient;
import com.gajraj.order.feign.ProductServiceClient;
import com.gajraj.order.model.Orders;
import com.gajraj.order.repo.OrdersRepo;
import org.junit.jupiter.api.Test;
import java.util.Optional;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PaymentConfirmationTest {
    @Test
    void repeatedConfirmationDoesNotFailOrSaveAgain() {
        OrdersRepo repository = mock(OrdersRepo.class);
        OrdersService service = new OrdersService(repository,
                mock(ProductServiceClient.class), mock(ManagerServiceClient.class));
        Orders order = new Orders();
        UUID id = UUID.randomUUID();
        order.setId(id);
        order.setOrderStatus(Orders.OrderStatus.PENDING);
        when(repository.findById(id)).thenReturn(Optional.of(order));
        when(repository.findForUpdate(id)).thenReturn(Optional.of(order));
        when(repository.save(order)).thenReturn(order);
        assertEquals("CONFIRMED", service.confirmPayment(id).getOrderStatus());
        assertEquals("CONFIRMED", service.confirmPayment(id).getOrderStatus());
        verify(repository, times(1)).save(order);
        order.setOrderStatus(Orders.OrderStatus.CANCELLED);
        assertThrows(RuntimeException.class, () -> service.confirmPayment(id));
    }
}
