package com.gajraj.manager.controller;

import com.gajraj.manager.service.managerService.ManagerDashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RequestMapping("/manager")
@RestController
public class ManagerController {

    private final ManagerDashboardService managerDashboardService;

    public ManagerController(ManagerDashboardService managerDashboardService) {
        this.managerDashboardService = managerDashboardService;
    }

    @GetMapping("/dashboard/{managerId}")
    public ResponseEntity<?> getDashboardStats(@PathVariable String managerId,
            @RequestHeader("Authorization") String authorization,
            org.springframework.security.core.Authentication auth) {
        if (!managerId.equals(auth.getName()) && auth.getAuthorities().stream().noneMatch(a->a.getAuthority().equals("ROLE_OWNER")))
            return ResponseEntity.status(403).build();
        return managerDashboardService.getDashboardStats(managerId, authorization);
    }
}
