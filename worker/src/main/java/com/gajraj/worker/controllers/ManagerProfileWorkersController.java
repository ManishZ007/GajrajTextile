package com.gajraj.worker.controllers;

import com.gajraj.worker.model.WorkerVerification;
import com.gajraj.worker.repo.WorkerRepo;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/manager/profile/workers")
public class ManagerProfileWorkersController {
    private final WorkerRepo workers;
    public ManagerProfileWorkersController(WorkerRepo workers) { this.workers = workers; }
    public record Row(UUID workerId, String userId, long code, String creator, String status, String approver, LocalDateTime createdAt) {}
    public record Result(String managerId, long created, long approved, List<Row> items, int totalPages) {}
    @GetMapping
    @Transactional(readOnly = true)
    public Result profile(Authentication auth, @RequestParam(defaultValue="0") int page) {
        if (auth == null || "anonymousUser".equals(auth.getName())) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        if (page < 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        String manager = auth.getName();
        var approved = WorkerVerification.VerificationStatus.APPROVED;
        var rows = workers.profileWorkers(manager, approved, PageRequest.of(page, 10, Sort.by("createdAt").descending())).map(w -> {
            var v = w.getVerification();
            String creator = w.getCreatedByManagerId();
            if (creator == null && v != null && "Initial registration".equals(v.getReason())) creator = v.getChangeBy();
            return new Row(w.getWorkerId(), w.getUserId(), w.getWorkerCode(), creator,
                v == null ? "PENDING" : v.getNewStatus().name(), v != null && v.getNewStatus() == approved ? v.getChangeBy() : null, w.getCreatedAt());
        });
        return new Result(manager, workers.countCreated(manager), workers.countApproved(manager, approved), rows.getContent(), rows.getTotalPages());
    }
}
