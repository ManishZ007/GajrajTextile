package com.gajraj.worker.service.workerService;

import com.gajraj.worker.repo.WorkerVerificationRepo;
import com.netflix.discovery.converters.Auto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RequestMapping("/manger-worker")
@RestController
public class ManagerOprationOnWorkers {

    @Autowired
    WorkerService workerService;

    @GetMapping("/all")
    public ResponseEntity<?> getAllWorkers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status) {
        try {
            return ResponseEntity.ok(workerService.getAllWorkers(page, size, status));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }


    @PutMapping("/verify/{workerId}")
    public ResponseEntity<?> verifyWorker(
            @PathVariable UUID workerId,
            @RequestParam String status,
            @RequestParam String changeBy,
            @RequestParam(required = false) String reason) {
        try {
            return ResponseEntity.ok(workerService.updateVerificationStatus(workerId, status, changeBy, reason));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

}
