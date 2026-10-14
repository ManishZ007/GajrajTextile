package com.gajraj.order.controller;
import com.gajraj.order.repo.*;
import com.gajraj.order.feign.ReservationWorkerClient;
import com.gajraj.order.service.ReadyMadeChecksService;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.util.*;

@RestController @RequestMapping("/manager/reservations/out-of-stock/{reservationId}/production")
public class ReservationProductionController {
    private final CustomerReservationRepo reservations;private final OrdersRepo orders;private final ReservationWorkerClient workers;private final ReadyMadeChecksService checks;private final String token;
    public ReservationProductionController(CustomerReservationRepo reservations,OrdersRepo orders,ReservationWorkerClient workers,ReadyMadeChecksService checks,@Value("${service.internal-token}") String token) {this.reservations=reservations;this.orders=orders;this.workers=workers;this.checks=checks;this.token=token;}
    public record Action(String action,String workerId,String note) {}
    @PostMapping @Transactional
    public Map<String,Object> update(@PathVariable UUID reservationId,@RequestBody Action body,Authentication actor) {
        var r=reservations.lock(reservationId).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND));
        if(!"OUT_OF_STOCK".equals(r.getType()) || r.getPaid().signum()<=0 || r.getOrderId()==null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Verify the deposit and wait for production order creation first");
        var o=orders.findForUpdate(r.getOrderId()).orElseThrow();
        if(Set.of(com.gajraj.order.model.Orders.OrderStatus.CANCELLED,com.gajraj.order.model.Orders.OrderStatus.DELIVERED,com.gajraj.order.model.Orders.OrderStatus.ON_HOLD).contains(o.getOrderStatus())) throw new ResponseStatusException(HttpStatus.CONFLICT,"Production cannot change for a held or closed order");
        if(Boolean.TRUE.equals(o.getShipmentStarted())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Shipment has started");
        if("ASSIGN".equals(body.action())) {
            UUID workerId=UUID.fromString(Objects.toString(body.workerId(),""));
            if(o.getRemakeWorkerId()!=null && !workerId.toString().equals(o.getRemakeWorkerId())) throw new ResponseStatusException(HttpStatus.CONFLICT,"Worker already assigned");
            if(body.note()==null || body.note().isBlank() || body.note().length()>1000) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Enter production instructions");
            var work=workers.assign(o.getId(),token,Map.of("workerId",workerId,"managerId",actor.getName(),"note",body.note(),"orderNumber",o.getOrderNumber()));
            o.setRemakeWorkerId(workerId.toString());o.setRemakeWorkerName(work.get("workerName").toString());o.setRemakeStatus(work.get("status").toString());
        } else if(Set.of("IN_PROGRESS","COMPLETED").contains(Objects.toString(body.action(),""))) {
            if("COMPLETED".equals(o.getRemakeStatus()) && "IN_PROGRESS".equals(body.action()) && !"REJECTED".equals(o.getReadyMadeQuality())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Rework requires a rejected quality check");
            var work=workers.status(o.getId(),token,Map.of("status",body.action()));o.setRemakeStatus(work.get("status").toString());
            if("IN_PROGRESS".equals(o.getRemakeStatus())) { o.setReadyMadeQuality("PENDING");o.setOrderStatus(com.gajraj.order.model.Orders.OrderStatus.IN_PROGRESS); }
            for(var item:o.getItems()) item.setCurrentStatus("COMPLETED".equals(o.getRemakeStatus()) ? com.gajraj.order.model.OrderItem.ItemStatus.COMPLETED : com.gajraj.order.model.OrderItem.ItemStatus.IN_PRODUCTION);
        } else if("APPROVE".equals(body.action()) || "REJECT".equals(body.action())) {
            checks.act(o.getId(),body.action(),body.note(),actor.getName());
        } else throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid production action");
        orders.save(o);return Map.of("status",o.getRemakeStatus());
    }
    @ExceptionHandler({IllegalArgumentException.class,IllegalStateException.class}) public org.springframework.http.ResponseEntity<?> invalid(RuntimeException e) { return org.springframework.http.ResponseEntity.badRequest().body(Map.of("error",Objects.toString(e.getMessage(),"Invalid action"))); }
    @ExceptionHandler(feign.FeignException.class) public org.springframework.http.ResponseEntity<?> unavailable(feign.FeignException e) { return org.springframework.http.ResponseEntity.status(503).body(Map.of("error","Worker service could not complete the action. Check worker approval and service availability, then retry.")); }
}
