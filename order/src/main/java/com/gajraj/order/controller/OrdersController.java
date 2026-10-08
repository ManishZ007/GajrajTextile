package com.gajraj.order.controller;

import com.gajraj.order.dto.CreateOrderRequestDTO;
import com.gajraj.order.dto.OrderListResponseDTO;
import com.gajraj.order.dto.OrderResponseDTO;
import com.gajraj.order.service.OrdersService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/orders")
public class OrdersController {

    private final OrdersService ordersService;
    @org.springframework.beans.factory.annotation.Value("${service.internal-token}")
    private String internalToken;

    public OrdersController(OrdersService ordersService) {
        this.ordersService = ordersService;
    }


    @PostMapping("/create")
    public ResponseEntity<?> createOrder(@RequestBody CreateOrderRequestDTO dto) {
        try {
            dto.setUserId(SecurityContextHolder.getContext().getAuthentication().getName());
            OrderResponseDTO response = ordersService.createOrder(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Internal server error"));
        }
    }

    // now this return order with items not a single one
    @GetMapping("/my-orders")
    public ResponseEntity<?> getMyOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            String userId = SecurityContextHolder.getContext().getAuthentication().getName();
            OrderListResponseDTO response = ordersService.getMyOrders(userId, page, size);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Internal server error"));
        }
    }


    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getOrdersByUserId(@PathVariable String userId) {
        try {
            List<OrderResponseDTO> response = ordersService.getOrdersByUserId(userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Internal server error"));
        }
    }


    @GetMapping("/all")
    public ResponseEntity<?> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String userId) {
        try {
            OrderListResponseDTO response = ordersService.getAllOrders(page, size, status, search, userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Internal server error"));
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
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Internal server error"));
        }
    }


    @PutMapping("/cancel/{orderId}")
    public ResponseEntity<?> cancelOrder(@PathVariable UUID orderId) {
        try {
            var authentication = SecurityContextHolder.getContext().getAuthentication();
            boolean staff = authentication.getAuthorities().stream().anyMatch(a -> java.util.Set.of("ROLE_MANAGER", "ROLE_OWNER", "ROLE_ADMIN").contains(a.getAuthority()));
            if (!staff && !authentication.getName().equals(ordersService.getOrderById(orderId).getUserId()))
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            OrderResponseDTO response = ordersService.cancelOrder(orderId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Internal server error"));
        }
    }


    @PutMapping("/status/{orderId}")
    public ResponseEntity<?> updateStatus(@PathVariable UUID orderId, @RequestParam String status) {
        try {
            OrderResponseDTO response = ordersService.updateOrderStatus(orderId, status);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Internal server error"));
        }
    }


    @PutMapping("/take/{orderId}")
    public ResponseEntity<?> takeOrder(@PathVariable UUID orderId) {
        try {
            String managerId = SecurityContextHolder.getContext().getAuthentication().getName();
            OrderResponseDTO response = ordersService.takeOrder(orderId, managerId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Internal server error"));
        }
    }


    @PutMapping("/internal/payment/confirm/{orderId}")
    public ResponseEntity<?> confirmPayment(@PathVariable UUID orderId,
            @RequestHeader(value = "X-Service-Token", defaultValue = "") String token) {
        if (internalToken.isBlank() || !java.security.MessageDigest.isEqual(
                internalToken.getBytes(java.nio.charset.StandardCharsets.UTF_8),
                token.getBytes(java.nio.charset.StandardCharsets.UTF_8))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        try {
            OrderResponseDTO response = ordersService.confirmPayment(orderId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Internal server error"));
        }
    }


    @PutMapping("/internal/status/{orderId}")
    public ResponseEntity<?> updateStatusInternal(@PathVariable UUID orderId, @RequestParam String status,
            @RequestHeader(value="X-Service-Token", defaultValue="") String token) {
        if (internalToken.isBlank() || !java.security.MessageDigest.isEqual(internalToken.getBytes(java.nio.charset.StandardCharsets.UTF_8), token.getBytes(java.nio.charset.StandardCharsets.UTF_8)))
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        try {
            OrderResponseDTO response = ordersService.updateOrderStatusInternal(orderId, status);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Internal server error"));
        }
    }
}
