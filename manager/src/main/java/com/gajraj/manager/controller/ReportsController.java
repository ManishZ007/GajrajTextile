package com.gajraj.manager.controller;

import com.gajraj.manager.dto.reportDTO.ReportCreateDTO;
import com.gajraj.manager.service.managerService.ReportsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/manager/reports")
public class ReportsController {

    @Autowired
    private ReportsService reportsService;

    @GetMapping("/all")
    public ResponseEntity<?> getAllReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String reportType,
            @RequestParam(required = false) String readStatus,
            @RequestParam(required = false) String approvalStatus) {
        return reportsService.getAllReports(page, size, reportType, readStatus, approvalStatus);
    }

    @GetMapping("/{reportId}")
    public ResponseEntity<?> getReportById(@PathVariable UUID reportId) {
        return reportsService.getReportById(reportId);
    }

    @PostMapping("/create")
    public ResponseEntity<?> createReport(@RequestBody ReportCreateDTO dto) {
        return reportsService.createReport(dto);
    }

    @PutMapping("/update/{reportId}")
    public ResponseEntity<?> updateReport(@PathVariable UUID reportId, @RequestBody ReportCreateDTO dto) {
        return reportsService.updateReport(reportId, dto);
    }

    @DeleteMapping("/delete/{reportId}")
    public ResponseEntity<?> deleteReport(@PathVariable UUID reportId) {
        return reportsService.deleteReport(reportId);
    }

    @PutMapping("/mark-read/{reportId}")
    public ResponseEntity<?> markAsRead(@PathVariable UUID reportId) {
        return reportsService.markAsRead(reportId);
    }

    @PutMapping("/approve/{reportId}")
    public ResponseEntity<?> approveReport(@PathVariable UUID reportId, @RequestParam boolean approved) {
        return reportsService.approveReport(reportId, approved);
    }
}
