package com.gajraj.order.controller;

import com.gajraj.order.dto.OrderListResponseDTO;
import com.gajraj.order.dto.OrderResponseDTO;
import com.gajraj.order.service.OrdersService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/manager/orders")
public class ManagerOrderController {

    private final OrdersService ordersService;

    public ManagerOrderController(OrdersService ordersService) {
        this.ordersService = ordersService;
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String orderType) {
        try {
            OrderListResponseDTO response = ordersService.getAllOrders(page, size, status, search, userId, orderType);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<?> getOrderById(@PathVariable UUID orderId) {
        try {
            OrderResponseDTO response = ordersService.getOrderById(orderId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{orderId}/take")
    public ResponseEntity<?> takeOrder(@PathVariable UUID orderId) {
        try {
            String managerId = SecurityContextHolder.getContext().getAuthentication().getName();
            OrderResponseDTO response = ordersService.takeOrder(orderId, managerId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{orderId}/status")
    public ResponseEntity<?> updateStatus(@PathVariable UUID orderId, @RequestParam String status) {
        try {
            String managerId = SecurityContextHolder.getContext().getAuthentication().getName();
            OrderResponseDTO response = ordersService.updateOrderStatusByManager(orderId, status, managerId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{orderId}/cancel")
    public ResponseEntity<?> cancelOrder(@PathVariable UUID orderId) {
        try {
            OrderResponseDTO response = ordersService.cancelOrder(orderId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }
}
