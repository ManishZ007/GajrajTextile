package com.gajraj.manager.controller;

import com.gajraj.manager.service.managerService.OrderFlowService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/manager/order-flow")
public class OrderFlowController {

    @Autowired
    private OrderFlowService orderFlowService;

    @GetMapping("/all")
    public ResponseEntity<?> getAllOrderFlows(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String productStatus,
            @RequestParam(required = false) String qualityCheck,
            @RequestParam(required = false) String shippingStatus) {
        return orderFlowService.getAllOrderFlows(page, size, productStatus, qualityCheck, shippingStatus);
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<?> getOrderFlow(@PathVariable String orderId) {
        return orderFlowService.getOrderFlowByOrderId(orderId);
    }

    // Stage 1: Manager picks up the order and starts production
    // Body: { "handledBy": "managerId" }
    @PutMapping("/start/{orderId}")
    public ResponseEntity<?> startProduction(@PathVariable String orderId,
                                             @RequestBody Map<String, String> body) {
        return orderFlowService.startProduction(orderId, body.get("handledBy"));
    }

    // Stage 2: Manager marks production as done
    @PutMapping("/complete/{orderId}")
    public ResponseEntity<?> completeProduction(@PathVariable String orderId) {
        return orderFlowService.completeProduction(orderId);
    }

    // Stage 3: Quality check result
    // Body: { "result": "APPROVED" | "REJECTED", "note": "optional" }
    @PutMapping("/quality-check/{orderId}")
    public ResponseEntity<?> qualityCheck(@PathVariable String orderId,
                                          @RequestBody Map<String, String> body) {
        return orderFlowService.updateQualityCheck(orderId, body.get("result"), body.get("note"));
    }

    // Stage 4: Mark ready for shipping (requires QC approved)
    @PutMapping("/ready-shipping/{orderId}")
    public ResponseEntity<?> markReadyForShipping(@PathVariable String orderId) {
        return orderFlowService.markReadyForShipping(orderId);
    }

    // Stage 5: Mark shipped
    @PutMapping("/ship/{orderId}")
    public ResponseEntity<?> markShipped(@PathVariable String orderId) {
        return orderFlowService.markShipped(orderId);
    }
}
