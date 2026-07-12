package com.gajraj.product.controller;

import com.gajraj.product.dto.AddToCartRequestDTO;
import com.gajraj.product.dto.UpdateCartItemRequestDTO;
import com.gajraj.product.service.CartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

@RestController
@RequestMapping("/cart")
public class CartController {

    @Autowired
    private CartService cartService;

    @PostMapping("/add")
    public ResponseEntity<?> addToCart(@RequestBody AddToCartRequestDTO dto) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(cartService.addToCart(dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{customerId}")
    public ResponseEntity<?> getCart(@PathVariable UUID customerId) {
        try {
            return ResponseEntity.ok(cartService.getCart(customerId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{customerId}/summary")
    public ResponseEntity<?> getCartSummary(@PathVariable UUID customerId) {
        try {
            return ResponseEntity.ok(cartService.getCartSummary(customerId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/item/{cartItemId}")
    public ResponseEntity<?> updateQuantity(@PathVariable UUID cartItemId,
                                             @RequestBody UpdateCartItemRequestDTO dto) {
        try {
            return ResponseEntity.ok(cartService.updateQuantity(cartItemId, dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/item/{cartItemId}")
    public ResponseEntity<?> removeItem(@PathVariable UUID cartItemId) {
        try {
            cartService.removeItem(cartItemId);
            return ResponseEntity.ok(Map.of("message", "Item removed from cart"));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/clear/{customerId}")
    public ResponseEntity<?> clearCart(@PathVariable UUID customerId) {
        try {
            cartService.clearCart(customerId);
            return ResponseEntity.ok(Map.of("message", "Cart cleared"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }
}
