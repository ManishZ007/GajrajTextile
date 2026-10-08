package com.gajraj.order.controller;
import com.gajraj.order.model.*;
import com.gajraj.order.repo.OrdersRepo;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
class ShippingProgressTest {
    @Test void labelDoesNotShipAndDeliveryUpdatesOrderAndItems() {
        var repo=mock(OrdersRepo.class); var id=UUID.randomUUID();var order=new Orders();order.setOrderStatus(Orders.OrderStatus.CONFIRMED);
        var item=new OrderItem();item.setCurrentStatus(OrderItem.ItemStatus.PENDING);order.getItems().add(item);
        when(repo.findForUpdate(id)).thenReturn(Optional.of(order));var controller=new OrderShippingController(repo,"test");
        controller.progress(id,"test",new OrderShippingController.Progress("CREATED","TRK","Mock", ""));
        assertEquals(OrderItem.ItemStatus.PENDING,item.getCurrentStatus());
        controller.progress(id,"test",new OrderShippingController.Progress("PICKED_UP","TRK","Mock", ""));
        assertEquals(OrderItem.ItemStatus.SHIPPED,item.getCurrentStatus());
        controller.progress(id,"test",new OrderShippingController.Progress("DELIVERED","TRK","Mock", ""));
        assertEquals(Orders.OrderStatus.DELIVERED,order.getOrderStatus());assertEquals(OrderItem.ItemStatus.DELIVERED,item.getCurrentStatus());
        controller.progress(id,"test",new OrderShippingController.Progress("IN_TRANSIT","TRK","Mock", ""));
        assertEquals(OrderItem.ItemStatus.DELIVERED,item.getCurrentStatus());
    }
}
