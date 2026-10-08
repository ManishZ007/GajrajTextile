package com.gajraj.order.service;
import com.gajraj.order.dto.CreateOrderRequestDTO;
import com.gajraj.order.feign.*;
import com.gajraj.order.model.Orders;
import com.gajraj.order.repo.OrdersRepo;
import org.junit.jupiter.api.*;
import java.math.BigDecimal;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
class OrderReservationTest {
    private final OrdersRepo repo=mock(OrdersRepo.class);
    private final ProductServiceClient product=mock(ProductServiceClient.class);
    private final ManagerServiceClient manager=mock(ManagerServiceClient.class);
    private final OrdersService service=new OrdersService(repo,product,manager);
    private final UUID id=UUID.randomUUID(), variant=UUID.randomUUID();
    private Orders order;
    @BeforeEach void setup() {
        when(repo.save(any())).thenAnswer(c->{order=c.getArgument(0);order.setId(id);when(repo.findForUpdate(id)).thenReturn(Optional.of(order));return order;});
    }
    private void create(String method) {
        var request=new CreateOrderRequestDTO();request.setPaymentMethod(method);request.setUserId("customer");
        request.setItems(List.of(new CreateOrderRequestDTO.OrderItemRequestDTO("product",variant.toString(),2,BigDecimal.TEN,"READY_MADE")));
        when(product.quote(eq(variant.toString()),any())).thenReturn(Map.of("productId","product","price",BigDecimal.TEN));
        service.createOrder(request);
    }
    @Test void checkoutReservesAndSuccessCommitsOnce() {
        create("CARD");
        verify(product).reserve(eq(id),any(),eq(Map.of(variant,2)));
        verify(product,never()).commit(any(),any());
        verifyNoInteractions(manager);
        service.confirmPayment(id);service.confirmPayment(id);
        verify(product,times(1)).commit(eq(id),any());
        verify(product,never()).decrementStock(anyString(),anyInt());
        assertTrue(order.getIntegrationPending());
        verifyNoInteractions(manager); // Fulfillment is dispatched by the durable integration job.
    }
    @Test void verifiedFailureCancelsAndReleasesOnce() {
        create("CARD");service.paymentFailed(id);service.paymentFailed(id);
        verify(product,times(1)).release(eq(id),any());
        assertEquals(Orders.OrderStatus.CANCELLED,order.getOrderStatus());
    }
    @Test void codCommitsImmediately() {
        create("COD");verify(product).commit(eq(id),any());
        assertEquals(new BigDecimal("20"),order.getTotalAmount());
        assertEquals(Orders.OrderStatus.CONFIRMED,order.getOrderStatus());
        assertTrue(order.getIntegrationPending());
        verifyNoInteractions(manager);
    }
    @Test void codCancellationRestoresCommittedStockOnce() {
        create("COD"); service.cancelOrder(id); service.cancelOrder(id);
        verify(product,times(1)).cancel(eq(id),any());
        assertEquals(Orders.OrderStatus.CANCELLED, order.getOrderStatus());
    }
    @Test void shippedCodCannotBeCancelled() {
        create("COD"); order.setShipmentStarted(true);
        assertThrows(IllegalStateException.class,()->service.cancelOrder(id));
        verify(product,never()).cancel(any(),any());
    }
    @Test void managerCancellationUsesStockRestoration() {
        create("COD");service.updateOrderStatusByManager(id,"CANCELLED","manager");
        verify(product).cancel(eq(id),any());
    }
    @Test void codRejectsPriceAboveLimitBeforeSaving() {
        var request=new CreateOrderRequestDTO(); request.setPaymentMethod("COD");
        request.setItems(List.of(new CreateOrderRequestDTO.OrderItemRequestDTO("product",variant.toString(),1,BigDecimal.ONE,"READY_MADE")));
        when(product.quote(eq(variant.toString()),any())).thenReturn(Map.of("productId","product","price",new BigDecimal("29001")));
        assertThrows(IllegalArgumentException.class,()->service.createOrder(request));
        verify(repo,never()).save(any());
    }
    @Test void failureCannotReleaseConfirmedOrder() {
        create("CARD");service.confirmPayment(id);service.paymentFailed(id);
        verify(product,never()).release(any(),any());
    }
}
