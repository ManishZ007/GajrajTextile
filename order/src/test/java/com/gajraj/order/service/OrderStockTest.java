package com.gajraj.order.service;

import com.gajraj.order.feign.ManagerServiceClient;
import com.gajraj.order.feign.ProductServiceClient;
import com.gajraj.order.model.OrderItem;
import com.gajraj.order.model.Orders;
import com.gajraj.order.repo.OrdersRepo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class OrderStockTest {
    private final OrdersRepo repo = mock(OrdersRepo.class);
    private final ProductServiceClient products = mock(ProductServiceClient.class);
    private final OrdersService service = new OrdersService(repo, products, mock(ManagerServiceClient.class));
    private Orders saved;

    @BeforeEach
    void setup() {
        when(repo.save(any())).thenAnswer(call -> {
            saved = call.getArgument(0);
            if (saved.getId() == null) saved.setId(UUID.randomUUID());
            when(repo.findForUpdate(saved.getId())).thenReturn(Optional.of(saved));
            return saved;
        });
    }

    private void create(String method) {
        // Existing orders predating reservations must retain the legacy path.
        Orders order = new Orders();
        order.setReservationManaged(null);
        order.setPaymentMethod(method);
        order.setOrderStatus(Orders.OrderStatus.PENDING);
        order.setTotalAmount(BigDecimal.TEN);
        OrderItem item = new OrderItem();
        item.setOrder(order);
        item.setVariantId("variant");
        item.setQuantity(2);
        item.setOrderType("READY_MADE");
        order.setItems(List.of(item));
        repo.save(order);
    }

    @Test
    void unpaidOrderAndCancellationNeverChangeInventory() {
        create("CARD");
        assertEquals(Orders.OrderStatus.PENDING, saved.getOrderStatus());
        assertEquals(false, saved.getStockDeducted());
        verifyNoInteractions(products);
        service.cancelOrder(saved.getId());
        verifyNoInteractions(products);
    }

    @Test
    void successfulPaymentDeductsOnlyOnce() {
        create("CARD");
        service.confirmPayment(saved.getId());
        service.confirmPayment(saved.getId());
        verify(products, times(1)).decrementStock("variant", 2);
        assertEquals(true, saved.getStockDeducted());
        assertEquals(Orders.OrderStatus.CONFIRMED, saved.getOrderStatus());
    }

    @Test
    void legacyCancellationRestoresPreviouslyDeductedStock() {
        create("CARD");
        saved.setStockDeducted(null);
        service.cancelOrder(saved.getId());
        verify(products).incrementStock("variant", 2);
        assertEquals(Orders.OrderStatus.CANCELLED, saved.getOrderStatus());
    }

    @Test
    void legacyPendingOrderDoesNotDeductTwice() {
        create("CARD");
        saved.setStockDeducted(null);
        service.confirmPayment(saved.getId());
        verifyNoInteractions(products);
    }

    @Test
    void partialStockFailureCompensatesAndDoesNotConfirm() {
        create("CARD");
        OrderItem second = new OrderItem();
        second.setVariantId("unavailable");
        second.setOrderType("READY_MADE");
        second.setQuantity(1);
        saved.setItems(new ArrayList<>(saved.getItems()));
        saved.getItems().add(second);
        when(products.decrementStock("unavailable", 1)).thenThrow(new RuntimeException("Out of stock"));
        assertThrows(RuntimeException.class, () -> service.confirmPayment(saved.getId()));
        verify(products).incrementStock("variant", 2);
        assertEquals(false, saved.getStockDeducted());
        assertEquals(Orders.OrderStatus.PENDING, saved.getOrderStatus());
    }
}
