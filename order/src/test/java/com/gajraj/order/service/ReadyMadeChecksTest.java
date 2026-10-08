package com.gajraj.order.service;
import com.gajraj.order.model.*;
import com.gajraj.order.repo.*;
import com.gajraj.order.controller.OrderShippingController;
import com.gajraj.order.feign.*;
import org.junit.jupiter.api.*;
import java.util.*;
import java.math.BigDecimal;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ReadyMadeChecksTest {
    final OrdersRepo orders = mock(OrdersRepo.class);
    final OrderCheckEventRepo events = mock(OrderCheckEventRepo.class);
    final ReadyMadeChecksService checks = new ReadyMadeChecksService(orders, events);
    final Orders order = new Orders();
    final UUID id = UUID.randomUUID();
    @BeforeEach void setup() {
        order.setId(id); order.setUserId("customer"); order.setPaymentMethod("COD"); order.setTotalAmount(BigDecimal.TEN);
        order.setOrderStatus(Orders.OrderStatus.CONFIRMED);
        var item = new OrderItem(); item.setOrderType("READY_MADE"); item.setCurrentStatus(OrderItem.ItemStatus.PENDING);
        order.getItems().add(item);
        when(orders.findForUpdate(id)).thenReturn(Optional.of(order));
        when(orders.save(order)).thenReturn(order);
    }
    @Test void holdReleasePreservesInventoryAndRequiresReinspection() {
        order.setStockDeducted(true); order.setReadyMadeQuality("APPROVED");
        checks.act(id, "HOLD", "Wrong variant", "manager-one");
        assertEquals(Orders.OrderStatus.ON_HOLD, order.getOrderStatus());
        assertEquals("Wrong variant", order.getHoldReason());
        assertThrows(IllegalStateException.class, () -> ReadyMadeChecksService.guardShipping(order));
        checks.act(id, "RELEASE", "Correct variant packed", "manager-two");
        assertEquals(Orders.OrderStatus.CONFIRMED, order.getOrderStatus());
        assertEquals("PENDING", order.getReadyMadeQuality());
        assertNull(order.getHoldReason()); assertTrue(order.getStockDeducted()); assertFalse(order.getCodCollected());
        assertEquals(OrderItem.ItemStatus.PENDING, order.getItems().getFirst().getCurrentStatus());
        verify(events).save(argThat(e -> e.getAction().equals("RELEASE") && e.getActor().equals("manager-two") && e.getCreatedAt() != null));
        assertThrows(IllegalStateException.class, () -> ReadyMadeChecksService.guardShipping(order));
    }
    @Test void realShippingEntryRejectsUncheckedAndFailedAndAcceptsPassed() {
        var shipping = new OrderShippingController(orders, "token");
        assertThrows(IllegalStateException.class, () -> shipping.begin(id, "token"));
        checks.act(id, "REJECT", "Damaged fabric", "manager");
        assertThrows(IllegalStateException.class, () -> shipping.begin(id, "token"));
        checks.act(id, "APPROVE", "Replacement checked", "manager");
        shipping.begin(id, "token"); assertTrue(order.getShipmentStarted());
        assertThrows(IllegalStateException.class, () -> checks.act(id, "HOLD", "reason", "manager"));
    }
    @Test void existingShipmentCanRetryButHoldAlwaysBlocks() {
        order.setShipmentStarted(true);
        assertDoesNotThrow(() -> ReadyMadeChecksService.guardShipping(order));
        order.setOrderStatus(Orders.OrderStatus.ON_HOLD);
        assertThrows(IllegalStateException.class, () -> ReadyMadeChecksService.guardShipping(order));
    }
    @Test void invalidActionsAndMissingReasonsDoNotWrite() {
        for (String action : List.of("HOLD", "RELEASE", "REJECT"))
            assertThrows(IllegalArgumentException.class, () -> checks.act(id, action, "  ", "manager"));
        assertThrows(IllegalArgumentException.class, () -> checks.act(id, "OTHER", "", "manager"));
        assertThrows(IllegalArgumentException.class, () -> checks.act(id, "HOLD", "a".repeat(1001), "manager"));
        assertThrows(IllegalArgumentException.class, () -> checks.act(id, "APPROVE", "", ""));
        verifyNoInteractions(events); verify(orders, never()).save(any());
    }
    @Test void customMixedEmptyAndMissingOrdersCannotUseChecks() {
        order.getItems().getFirst().setOrderType("CUSTOM");
        assertThrows(IllegalArgumentException.class, () -> checks.act(id, "APPROVE", "", "manager"));
        var ready = new OrderItem(); ready.setOrderType("READY_MADE"); order.getItems().add(ready);
        assertThrows(IllegalArgumentException.class, () -> checks.act(id, "APPROVE", "", "manager"));
        order.getItems().clear();
        assertThrows(IllegalArgumentException.class, () -> checks.act(id, "APPROVE", "", "manager"));
        assertThrows(IllegalArgumentException.class, () -> checks.act(UUID.randomUUID(), "APPROVE", "", "manager"));
        verifyNoInteractions(events);
    }
    @Test void terminalAndUnpaidOrdersAreReadOnly() {
        for (var status : List.of(Orders.OrderStatus.PENDING, Orders.OrderStatus.CANCELLED, Orders.OrderStatus.DELIVERED)) {
            order.setOrderStatus(status);
            assertThrows(IllegalStateException.class, () -> checks.act(id, "HOLD", "reason", "manager"));
        }
    }
    @Test void duplicateHoldAndQualityWhileHeldAreRejected() {
        checks.act(id, "HOLD", "Inspect", "manager");
        assertThrows(IllegalStateException.class, () -> checks.act(id, "HOLD", "Inspect", "manager"));
        assertThrows(IllegalStateException.class, () -> checks.act(id, "APPROVE", "", "manager"));
        checks.act(id, "RELEASE", "Resolved", "manager");
        assertThrows(IllegalStateException.class, () -> checks.act(id, "RELEASE", "Resolved", "manager"));
    }
    @Test void genericStatusRoutesCannotBypassHoldOrQuality() {
        var service = new OrdersService(orders, mock(ProductServiceClient.class), mock(ManagerServiceClient.class));
        assertThrows(IllegalStateException.class, () -> service.updateOrderStatusByManager(id, "ON_HOLD", "manager"));
        assertThrows(IllegalStateException.class, () -> service.updateOrderStatusByManager(id, "COMPLETED", "manager"));
        assertThrows(IllegalStateException.class, () -> service.updateOrderStatusInternal(id, "DELIVERED"));
        checks.act(id, "HOLD", "Inspect", "manager");
        assertThrows(IllegalStateException.class, () -> service.updateOrderStatusInternal(id, "CONFIRMED"));
        checks.act(id, "RELEASE", "Resolved", "manager");
        checks.act(id, "APPROVE", "", "manager");
        assertEquals("COMPLETED", service.updateOrderStatusByManager(id, "COMPLETED", "manager").getOrderStatus());
    }
}
