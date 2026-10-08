package com.gajraj.order.controller;
import com.gajraj.order.repo.OrdersRepo;
import com.gajraj.order.model.Orders;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.util.*;

@RestController
@RequestMapping("/orders/internal/shipping")
public class OrderShippingController {
    private final OrdersRepo orders;
    private final String token;
    public OrderShippingController(OrdersRepo orders, @Value("${service.internal-token}") String token) {this.orders=orders;this.token=token;}
    private void authorize(String supplied) {
        if (token.isBlank() || !java.security.MessageDigest.isEqual(token.getBytes(java.nio.charset.StandardCharsets.UTF_8), supplied.getBytes(java.nio.charset.StandardCharsets.UTF_8)))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    }
    @PostMapping("/{id}/begin")
    @Transactional
    public Map<String,Object> begin(@PathVariable UUID id, @RequestHeader("X-Service-Token") String supplied) {
        authorize(supplied);
        var order = orders.findForUpdate(id).orElseThrow();
        if (order.getOrderStatus() == Orders.OrderStatus.PENDING || order.getOrderStatus() == Orders.OrderStatus.CANCELLED || order.getOrderStatus() == Orders.OrderStatus.DELIVERED)
            throw new IllegalStateException("Order is not eligible for shipping");
        if (Boolean.TRUE.equals(order.getIntegrationPending())) throw new IllegalStateException("Order integrations are pending; retry shortly");
        com.gajraj.order.service.ReadyMadeChecksService.guardShipping(order);
        order.setShipmentStarted(true); orders.save(order);
        return Map.of("userId", order.getUserId(), "paymentMethod", order.getPaymentMethod(), "codAmount", "COD".equalsIgnoreCase(order.getPaymentMethod()) ? order.getTotalAmount() : java.math.BigDecimal.ZERO);
    }
    @GetMapping("/{id}/owner")
    public Map<String,String> owner(@PathVariable UUID id, @RequestHeader("X-Service-Token") String supplied) {
        authorize(supplied);
        return Map.of("userId", orders.findById(id).orElseThrow().getUserId());
    }
    public record Progress(String status, String trackingNumber, String courier, String estimatedDelivery) {}
    @PostMapping("/{id}/progress")
    @Transactional
    public void progress(@PathVariable UUID id, @RequestHeader("X-Service-Token") String supplied, @RequestBody Progress progress) {
        authorize(supplied);
        if (!Set.of("CREATED", "PACKED", "READY_FOR_PICKUP", "PICKED_UP", "IN_TRANSIT", "ARRIVED_AT_HUB", "OUT_FOR_DELIVERY", "DELIVERED").contains(progress.status()))
            throw new IllegalArgumentException("Invalid shipment progress");
        var order = orders.findForUpdate(id).orElseThrow();
        if (order.getOrderStatus() == Orders.OrderStatus.CANCELLED || order.getOrderStatus() == Orders.OrderStatus.PENDING)
            throw new IllegalStateException("Order cannot receive shipment progress");
        boolean delivered = "DELIVERED".equals(progress.status());
        boolean shipped = Set.of("PICKED_UP", "IN_TRANSIT", "ARRIVED_AT_HUB", "OUT_FOR_DELIVERY", "DELIVERED").contains(progress.status());
        for (var item : order.getItems()) {
            item.setTrackingNumber(progress.trackingNumber()); item.setCourierService(progress.courier()); item.setEstimatedDelivery(progress.estimatedDelivery());
            if (item.getCurrentStatus() == com.gajraj.order.model.OrderItem.ItemStatus.CANCELLED) continue;
            if (delivered) item.setCurrentStatus(com.gajraj.order.model.OrderItem.ItemStatus.DELIVERED);
            else if (shipped && item.getCurrentStatus() != com.gajraj.order.model.OrderItem.ItemStatus.DELIVERED)
                item.setCurrentStatus(com.gajraj.order.model.OrderItem.ItemStatus.SHIPPED);
        }
        if (delivered) order.setOrderStatus(Orders.OrderStatus.DELIVERED);
        orders.save(order);
    }

    @PostMapping("/{id}/cancelled")
    @Transactional
    public void cancelled(@PathVariable UUID id, @RequestHeader("X-Service-Token") String supplied) {
        authorize(supplied); var order=orders.findForUpdate(id).orElseThrow();
        if (Boolean.TRUE.equals(order.getCodCollected()) || order.getOrderStatus()==Orders.OrderStatus.DELIVERED) throw new IllegalStateException("Order already delivered");
        order.setShipmentStarted(false); orders.save(order);
    }
    @PostMapping("/{id}/collected")
    @Transactional
    public void collected(@PathVariable UUID id, @RequestHeader("X-Service-Token") String supplied) {
        authorize(supplied); var order=orders.findForUpdate(id).orElseThrow();
        if (!"COD".equalsIgnoreCase(order.getPaymentMethod()) || order.getOrderStatus()==Orders.OrderStatus.CANCELLED || !Boolean.TRUE.equals(order.getShipmentStarted()))
            throw new IllegalStateException("Order cannot accept COD collection");
        if (!Boolean.TRUE.equals(order.getCodCollected())) {
            order.setCodCollected(true); order.setIntegrationPending(true); orders.save(order);
        }
    }
}
