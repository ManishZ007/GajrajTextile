package com.gajraj.manager.controller;


import com.gajraj.manager.dto.userDTO.SaveUserDTO;
import com.gajraj.manager.feign.ConnectionInterfaceAuthentication;
import com.gajraj.manager.service.managerService.InternalManagerService;
import com.gajraj.manager.service.managerService.ManagerService;
import com.gajraj.manager.service.managerService.OrderFlowService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RequestMapping("internal")
@RestController
public class InternalManagerController {

    @Autowired
    InternalManagerService internalManagerService;

    @Autowired
    OrderFlowService orderFlowService;

    @Autowired
    ManagerService managerService;

    @Autowired
    ConnectionInterfaceAuthentication authentication;

    @GetMapping("/managers/{userId}")
    public ResponseEntity<?> getManagerProfile(@PathVariable String userId) {
        try {
            Map<String, Object> profile = managerService.getManagerProfile(userId);
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/managers/{userId}")
    public ResponseEntity<?> updateManagerProfile(@PathVariable String userId,
                                                   @RequestBody Map<String, String> body) {
        try {
            Map<String, Object> updated = managerService.updateManagerProfile(userId, body);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }


    @Autowired com.gajraj.manager.repo.ManagerRepo managerRepo;
    @DeleteMapping("/managers/{userId}")
    public ResponseEntity<?> deleteManager(@PathVariable java.util.UUID userId) {
        var manager=managerRepo.findManagerByUserId(userId.toString());
        // Idempotent: auth may retry after the downstream delete already succeeded.
        if(manager!=null) managerRepo.delete(manager);
        return ResponseEntity.ok(Map.of("message","Manager profile deleted; historical records retained"));
    }

    @PostMapping("/saveNewUser")
    public ResponseEntity<?> saveNewUser(@RequestBody SaveUserDTO saveUserDTO) {
        return internalManagerService.saveNewUser(saveUserDTO);
    }

    @PostMapping("/order-flow/create")
    public ResponseEntity<?> createOrderFlow(@RequestBody Map<String, String> request) {
        return orderFlowService.createOrderFlow(request);
    }

    // Called by Order Service to check current production/shipping status
    @GetMapping("/order-flow/status/{orderId}")
    public ResponseEntity<?> getOrderFlowStatus(@PathVariable String orderId) {
        return orderFlowService.getInternalStatus(orderId);
    }
}
