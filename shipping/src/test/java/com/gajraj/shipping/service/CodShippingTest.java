package com.gajraj.shipping.service;
import com.gajraj.shipping.model.Shipment;
import com.gajraj.shipping.enums.ShipmentStatus;
import com.gajraj.shipping.repo.*;
import com.gajraj.shipping.provider.*;
import org.springframework.test.util.ReflectionTestUtils;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
class CodShippingTest {
    @Test void onlyDeliveredCodCanBeCollectedAndRetryDoesNotDuplicate() {
        var repo=mock(ShipmentRepo.class);var client=mock(OrderShippingClient.class);
        var service=new ShippingService(mock(ShippingProvider.class),mock(MockShippingProvider.class),repo,mock(ShipmentTrackingRepo.class),mock(ShippingProviderRepo.class));
        ReflectionTestUtils.setField(service,"orderClient",client);
        var shipment=new Shipment();var id=UUID.randomUUID();shipment.setId(id);shipment.setOrderId("order");
        shipment.setPaymentMethod("COD");shipment.setProvider(com.gajraj.shipping.enums.Provider.MOCK);
        shipment.setShipmentType(com.gajraj.shipping.enums.ShipmentType.READYMADE);
        shipment.setShipmentStatus(ShipmentStatus.OUT_FOR_DELIVERY);
        when(repo.lockById(id)).thenReturn(Optional.of(shipment));
        assertThrows(IllegalStateException.class,()->service.collectCod(id.toString()));verifyNoInteractions(client);
        shipment.setShipmentStatus(ShipmentStatus.DELIVERED);
        service.collectCod(id.toString());service.collectCod(id.toString());
        verify(client,times(1)).collected("order");assertTrue(shipment.getCodCollected());
    }
}
