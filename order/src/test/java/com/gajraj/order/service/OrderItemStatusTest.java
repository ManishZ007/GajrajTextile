package com.gajraj.order.service;

import com.gajraj.order.feign.ManagerServiceClient;
import com.gajraj.order.feign.ProductServiceClient;
import com.gajraj.order.model.OrderItem;
import com.gajraj.order.model.Orders;
import com.gajraj.order.repo.OrdersRepo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class OrderItemStatusTest {
    private final OrdersRepo repository = mock(OrdersRepo.class);
    private final OrdersService service = new OrdersService(repository,
            mock(ProductServiceClient.class), mock(ManagerServiceClient.class));
    private final Orders order = new Orders();
    private final OrderItem item = new OrderItem();
    private final UUID id = UUID.randomUUID();

    @BeforeEach
    void setup() {
        order.setId(id);
        order.setOrderStatus(Orders.OrderStatus.CONFIRMED);
        item.setCurrentStatus(OrderItem.ItemStatus.PENDING);
        order.setItems(new ArrayList<>(List.of(item)));
        when(repository.findById(id)).thenReturn(Optional.of(order));
        when(repository.findForUpdate(id)).thenReturn(Optional.of(order));
        when(repository.save(order)).thenReturn(order);
    }

    @Test
    void managerCompletionCompletesItemsWithoutClaimingDelivery() {
        service.updateOrderStatusByManager(id, "COMPLETED", "manager");
        assertEquals(OrderItem.ItemStatus.COMPLETED, item.getCurrentStatus());
        verify(repository).save(order);
    }

    @Test
    void internalProgressAndDeliveryUpdateItems() {
        service.updateOrderStatusInternal(id, "IN_PROGRESS");
        assertEquals(OrderItem.ItemStatus.IN_PRODUCTION, item.getCurrentStatus());
        service.updateOrderStatusInternal(id, "DELIVERED");
        assertEquals(OrderItem.ItemStatus.DELIVERED, item.getCurrentStatus());
    }

    @Test
    void productionCompletionPreservesShippingProgress() {
        OrderItem delivered = new OrderItem();
        delivered.setCurrentStatus(OrderItem.ItemStatus.DELIVERED);
        item.setCurrentStatus(OrderItem.ItemStatus.SHIPPED);
        order.getItems().add(delivered);
        service.updateOrderStatusByManager(id, "COMPLETED", "manager");
        assertEquals(OrderItem.ItemStatus.SHIPPED, item.getCurrentStatus());
        assertEquals(OrderItem.ItemStatus.DELIVERED, delivered.getCurrentStatus());
    }

    @Test
    void paymentAndPauseDoNotAdvanceFulfillment() {
        order.setOrderStatus(Orders.OrderStatus.PENDING);
        service.confirmPayment(id);
        assertEquals(OrderItem.ItemStatus.PENDING, item.getCurrentStatus());
        service.updateOrderStatusByManager(id, "ON_HOLD", "manager");
        assertEquals(OrderItem.ItemStatus.PENDING, item.getCurrentStatus());
    }

    @Test
    void cancellationUpdatesPendingItems() {
        order.setOrderStatus(Orders.OrderStatus.PENDING);
        service.cancelOrder(id);
        assertEquals(OrderItem.ItemStatus.CANCELLED, item.getCurrentStatus());
    }

    @Test
    void managerCannotConfirmUnpaidOrderOrReopenCancelledOrder() {
        order.setOrderStatus(Orders.OrderStatus.PENDING);
        assertThrows(IllegalArgumentException.class, () -> service.updateOrderStatusByManager(id, "CONFIRMED", "manager"));
        order.setOrderStatus(Orders.OrderStatus.CANCELLED);
        assertThrows(IllegalArgumentException.class, () -> service.updateOrderStatusByManager(id, "COMPLETED", "manager"));
        verify(repository, never()).save(any());
    }

    @Test
    void managerCancellationUsesStockReleasePath() {
        order.setOrderStatus(Orders.OrderStatus.PENDING);
        service.updateOrderStatusByManager(id, "CANCELLED", "manager");
        assertEquals(Orders.OrderStatus.CANCELLED, order.getOrderStatus());
        assertEquals(OrderItem.ItemStatus.CANCELLED, item.getCurrentStatus());
    }

    @Test
    void managerCannotClaimDelivery() {
        assertThrows(IllegalArgumentException.class, () -> service.updateOrderStatusByManager(id, "DELIVERED", "manager"));
    }
}
