package com.gajraj.product.controller;

import com.gajraj.product.service.WishlistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

@RestController
@RequestMapping("/wishlist")
public class WishlistController {

    @Autowired
    private WishlistService wishlistService;

    @PostMapping("/add")
    public ResponseEntity<?> add(@RequestBody Map<String, String> body) {
        try {
            UUID customerId = UUID.fromString(body.get("customerId"));
            UUID productId = UUID.fromString(body.get("productId"));
            return ResponseEntity.status(HttpStatus.CREATED).body(wishlistService.addToWishlist(customerId, productId));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{customerId}")
    public ResponseEntity<?> getWishlist(@PathVariable UUID customerId) {
        try {
            return ResponseEntity.ok(wishlistService.getWishlist(customerId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{customerId}/check/{productId}")
    public ResponseEntity<?> check(@PathVariable UUID customerId, @PathVariable UUID productId) {
        try {
            return ResponseEntity.ok(wishlistService.checkWishlist(customerId, productId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{customerId}/count")
    public ResponseEntity<?> count(@PathVariable UUID customerId) {
        try {
            return ResponseEntity.ok(wishlistService.getWishlistCount(customerId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/remove/{wishlistId}")
    public ResponseEntity<?> removeByWishlistId(@PathVariable UUID wishlistId) {
        try {
            wishlistService.removeByWishlistId(wishlistId);
            return ResponseEntity.ok(Map.of("message", "Removed from wishlist"));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/remove")
    public ResponseEntity<?> removeByProduct(@RequestParam UUID customerId, @RequestParam UUID productId) {
        try {
            wishlistService.removeByProduct(customerId, productId);
            return ResponseEntity.ok(Map.of("message", "Removed from wishlist"));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/clear/{customerId}")
    public ResponseEntity<?> clear(@PathVariable UUID customerId) {
        try {
            wishlistService.clearWishlist(customerId);
            return ResponseEntity.ok(Map.of("message", "Wishlist cleared"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }
}
