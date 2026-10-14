package com.gajraj.order.service;
import com.gajraj.order.controller.ReservationProductionController;
import com.gajraj.order.feign.ReservationWorkerClient;
import com.gajraj.order.model.*;
import com.gajraj.order.repo.*;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;
import java.math.BigDecimal;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;
class ReservationProductionTest {
    @Test void depositRequiredAndAssignmentUsesSignedManagerAndReworkRequiresRejectedQuality() {
        var reservations=mock(CustomerReservationRepo.class);var orders=mock(OrdersRepo.class);var worker=mock(ReservationWorkerClient.class);
        var checks=mock(ReadyMadeChecksService.class);var controller=new ReservationProductionController(reservations,orders,worker,checks,"token");
        UUID id=UUID.randomUUID(),orderId=UUID.randomUUID(),workerId=UUID.randomUUID();
        var r=new CustomerReservation();r.setType("OUT_OF_STOCK");when(reservations.lock(id)).thenReturn(Optional.of(r));
        var actor=new TestingAuthenticationToken("signed-manager","ignored");
        var assignment=new ReservationProductionController.Action("ASSIGN",workerId.toString(),"Make exact variant");
        assertThrows(ResponseStatusException.class,()->controller.update(id,assignment,actor));verifyNoInteractions(worker);
        r.setPaid(BigDecimal.TEN);r.setOrderId(orderId);var o=new Orders();o.setId(orderId);o.setOrderNumber("ORES-2026-0001");o.setOrderStatus(Orders.OrderStatus.CONFIRMED);o.setRemakeStatus("AWAITING_ASSIGNMENT");
        when(orders.findForUpdate(orderId)).thenReturn(Optional.of(o));
        when(worker.assign(eq(orderId),eq("token"),any())).thenReturn(Map.of("workerName","Worker Name","status","ASSIGNED"));
        controller.update(id,assignment,actor);assertEquals("Worker Name",o.getRemakeWorkerName());
        verify(worker).assign(eq(orderId),eq("token"),argThat(body->"signed-manager".equals(body.get("managerId"))));
        o.setRemakeStatus("COMPLETED");o.setReadyMadeQuality("APPROVED");
        assertThrows(ResponseStatusException.class,()->controller.update(id,new ReservationProductionController.Action("IN_PROGRESS",null,null),actor));
        o.setReadyMadeQuality("REJECTED");when(worker.status(eq(orderId),eq("token"),any())).thenReturn(Map.of("status","IN_PROGRESS"));
        controller.update(id,new ReservationProductionController.Action("IN_PROGRESS",null,null),actor);assertEquals("PENDING",o.getReadyMadeQuality());
        o.setShipmentStarted(true);assertThrows(ResponseStatusException.class,()->controller.update(id,assignment,actor));
    }
}
