package com.gajraj.manager.controller;

import com.gajraj.manager.dto.priceChangeDTO.PriceChangeCreateDTO;
import com.gajraj.manager.service.managerService.PriceChangeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/manager/price-changes")
public class PriceChangeController {
    @Autowired private com.gajraj.manager.config.ManagerRecordAccess access;

    @Autowired
    private PriceChangeService priceChangeService;

    @GetMapping("/all")
    public ResponseEntity<?> getAllPriceChanges(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String approvalStatus,
            @RequestParam(required = false) String productId) {
        return priceChangeService.getAllPriceChanges(page, size, approvalStatus, productId);
    }

    @PostMapping("/create")
    public ResponseEntity<?> createPriceChange(@RequestBody PriceChangeCreateDTO dto, Authentication auth) {
        dto.setUpdatedBy(auth.getName());
        return priceChangeService.createPriceChange(dto);
    }

    @PutMapping("/approve/{priceChangeId}")
    public ResponseEntity<?> approvePriceChange(@PathVariable UUID priceChangeId, @RequestParam boolean approved) {
        return priceChangeService.approvePriceChange(priceChangeId, approved);
    }

    @DeleteMapping("/delete/{priceChangeId}")
    public ResponseEntity<?> deletePriceChange(@PathVariable UUID priceChangeId, Authentication auth) {
        access.price(priceChangeId, auth);
        return priceChangeService.deletePriceChange(priceChangeId);
    }
}
