package com.gajraj.order.controller;

import com.gajraj.order.dto.dealer.AddPaymentRequestDTO;
import com.gajraj.order.dto.dealer.DealerOrderRequestDTO;
import com.gajraj.order.service.DealerOrderService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

@RestController
@RequestMapping("/dealer-orders")
public class DealerOrderController {

    private final DealerOrderService dealerOrderService;

    public DealerOrderController(DealerOrderService dealerOrderService) {
        this.dealerOrderService = dealerOrderService;
    }

    @PostMapping("/create")
    public ResponseEntity<?> create(@RequestBody DealerOrderRequestDTO dto) {
        try {
            String managerId = SecurityContextHolder.getContext().getAuthentication().getName();
            return ResponseEntity.status(HttpStatus.CREATED).body(dealerOrderService.createOrder(dto, managerId));
        } catch (IllegalArgumentException | NoSuchElementException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String managerId) {
        try {
            return ResponseEntity.ok(dealerOrderService.getAllOrders(page, size, status, managerId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<?> getById(@PathVariable UUID orderId) {
        try {
            return ResponseEntity.ok(dealerOrderService.getOrderById(orderId));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/by-dealer/{dealerId}")
    public ResponseEntity<?> getByDealer(
            @PathVariable UUID dealerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            return ResponseEntity.ok(dealerOrderService.getOrdersByDealer(dealerId, page, size));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/update/{orderId}")
    public ResponseEntity<?> update(@PathVariable UUID orderId, @RequestBody DealerOrderRequestDTO dto) {
        try {
            return ResponseEntity.ok(dealerOrderService.updateOrder(orderId, dto));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/status/{orderId}")
    public ResponseEntity<?> updateStatus(@PathVariable UUID orderId, @RequestParam String status) {
        try {
            return ResponseEntity.ok(dealerOrderService.updateStatus(orderId, status));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/delete/{orderId}")
    public ResponseEntity<?> delete(@PathVariable UUID orderId) {
        try {
            dealerOrderService.deleteOrder(orderId);
            return ResponseEntity.ok(Map.of("message", "Dealer order deleted"));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    // ── Payment endpoints ─────────────────────────────────────────────────────

    @PostMapping("/{orderId}/payments/add")
    public ResponseEntity<?> addPayment(@PathVariable UUID orderId, @RequestBody AddPaymentRequestDTO dto) {
        try {
            String managerId = SecurityContextHolder.getContext().getAuthentication().getName();
            return ResponseEntity.status(HttpStatus.CREATED).body(dealerOrderService.addPayment(orderId, dto, managerId));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{orderId}/payments/{paymentId}")
    public ResponseEntity<?> deletePayment(@PathVariable UUID orderId, @PathVariable UUID paymentId) {
        try {
            dealerOrderService.deletePayment(orderId, paymentId);
            return ResponseEntity.ok(Map.of("message", "Payment removed"));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }
}
