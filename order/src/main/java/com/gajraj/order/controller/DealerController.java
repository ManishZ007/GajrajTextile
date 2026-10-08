package com.gajraj.order.controller;

import com.gajraj.order.dto.dealer.DealerRequestDTO;
import com.gajraj.order.service.DealerService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

@RestController
@RequestMapping("/dealers")
public class DealerController {

    private final DealerService dealerService;

    public DealerController(DealerService dealerService) {
        this.dealerService = dealerService;
    }

    @PostMapping("/create")
    public ResponseEntity<?> create(@RequestBody DealerRequestDTO dto) {
        try {
            String managerId = SecurityContextHolder.getContext().getAuthentication().getName();
            return ResponseEntity.status(HttpStatus.CREATED).body(dealerService.createDealer(dto, managerId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/my-dealers")
    public ResponseEntity<?> getMyDealers() {
        try {
            String managerId = SecurityContextHolder.getContext().getAuthentication().getName();
            return ResponseEntity.ok(dealerService.getDealersByManager(managerId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAll(@RequestParam(required = false) String search) {
        try {
            return ResponseEntity.ok(dealerService.getAllDealers(search));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{dealerId}")
    public ResponseEntity<?> getById(@PathVariable UUID dealerId) {
        try {
            return ResponseEntity.ok(dealerService.getDealerById(dealerId));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/update/{dealerId}")
    public ResponseEntity<?> update(@PathVariable UUID dealerId, @RequestBody DealerRequestDTO dto) {
        try {
            return ResponseEntity.ok(dealerService.updateDealer(dealerId, dto));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/delete/{dealerId}")
    public ResponseEntity<?> delete(@PathVariable UUID dealerId) {
        try {
            dealerService.deleteDealer(dealerId);
            return ResponseEntity.ok(Map.of("message", "Dealer deleted"));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }
}
