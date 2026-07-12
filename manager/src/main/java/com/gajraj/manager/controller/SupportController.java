package com.gajraj.manager.controller;

import com.gajraj.manager.dto.supportDTO.SupportCaseCreateDTO;
import com.gajraj.manager.service.managerService.SupportCaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/manager/support")
public class SupportController {

    @Autowired
    private SupportCaseService supportCaseService;

    @GetMapping("/all")
    public ResponseEntity<?> getAllCases(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String issueType,
            @RequestParam(required = false) String search) {
        return supportCaseService.getAllCases(page, size, status, issueType, search);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getCaseById(@PathVariable UUID id) {
        return supportCaseService.getCaseById(id);
    }

    @PostMapping("/create")
    public ResponseEntity<?> createCase(@RequestBody SupportCaseCreateDTO dto) {
        return supportCaseService.createCase(dto);
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<?> updateCase(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        return supportCaseService.updateCase(
                id,
                body.get("status"),
                body.get("handledBy"),
                body.get("resolutionNote")
        );
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> deleteCase(@PathVariable UUID id) {
        return supportCaseService.deleteCase(id);
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        return supportCaseService.getStats();
    }
}
