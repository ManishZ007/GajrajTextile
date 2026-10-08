package com.gajraj.shipping.service;
import com.gajraj.shipping.model.*;
import com.gajraj.shipping.enums.*;
import com.gajraj.shipping.repo.*;
import com.gajraj.shipping.provider.*;
import com.gajraj.shipping.dto.*;
import org.junit.jupiter.api.*;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
class MockShippingFlowTest {
    final ShipmentRepo repo=mock(ShipmentRepo.class);
    final ShipmentTrackingRepo events=mock(ShipmentTrackingRepo.class);
    final OrderShippingClient client=mock(OrderShippingClient.class);
    final ShippingService service=new ShippingService(new MockShippingProvider(),new MockShippingProvider(),repo,events,mock(ShippingProviderRepo.class));
    final Shipment shipment=new Shipment();
    @BeforeEach void setup() {
        ReflectionTestUtils.setField(service,"orderClient",client);
        shipment.setId(UUID.randomUUID());shipment.setOrderId("order");shipment.setUserId("customer");
        shipment.setProvider(Provider.MOCK);shipment.setShipmentType(ShipmentType.READYMADE);shipment.setShipmentStatus(ShipmentStatus.CREATED);
        when(repo.lockById(shipment.getId())).thenReturn(Optional.of(shipment));when(repo.save(any())).thenAnswer(i->i.getArgument(0));
    }
    @AfterEach void clear() {SecurityContextHolder.clearContext();}
    @Test void progressesAndRetriesOrderSynchronization() {
        var request=new NextStatusRequest();request.setShipmentId(shipment.getId().toString());
        service.advanceMockStatus(request);
        assertEquals(ShipmentStatus.PACKED,shipment.getShipmentStatus());assertTrue(shipment.getOrderSyncPending());
        doThrow(new RuntimeException("Order offline")).doNothing().when(client).progress(shipment);
        assertThrows(RuntimeException.class,()->service.syncOrder(shipment.getId()));assertTrue(shipment.getOrderSyncPending());
        service.syncOrder(shipment.getId());assertFalse(shipment.getOrderSyncPending());
        verify(events,times(1)).save(any());
    }
    @Test void otherCustomerCannotReadTimeline() {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("another",null,List.of()));
        when(client.owner("order")).thenReturn("customer");
        assertThrows(org.springframework.web.server.ResponseStatusException.class,()->service.timeline("order"));
        verify(repo,never()).findByOrderId(any());
    }
    @Test void deliveredShipmentCannotAdvance() {
        shipment.setShipmentStatus(ShipmentStatus.DELIVERED);
        var request=new NextStatusRequest();request.setShipmentId(shipment.getId().toString());
        assertThrows(RuntimeException.class,()->service.advanceMockStatus(request));verify(events,never()).save(any());
    }
}
