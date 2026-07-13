package com.gajraj.manager.controller;


import com.gajraj.manager.dto.userDTO.SaveUserDTO;
import com.gajraj.manager.service.managerService.InternalManagerService;
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
