package com.gajraj.worker.controllers;
import com.gajraj.worker.model.*;
import com.gajraj.worker.repo.*;
import com.gajraj.worker.feign.ConnectionInterface;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.util.*;
import java.time.Instant;

@RestController @RequestMapping("/internal/reservation-work")
public class ReservationWorkController {
    private final ReservationWorkRepo work; private final WorkerRepo workers; private final ConnectionInterface auth; private final String token;
    public ReservationWorkController(ReservationWorkRepo work,WorkerRepo workers,ConnectionInterface auth,@Value("${SERVICE_INTERNAL_TOKEN:}") String token) { this.work=work;this.workers=workers;this.auth=auth;this.token=token; }
    void authorize(String supplied) {
        if(token.isBlank() || !java.security.MessageDigest.isEqual(token.getBytes(java.nio.charset.StandardCharsets.UTF_8),supplied.getBytes(java.nio.charset.StandardCharsets.UTF_8))) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    }
    public record Assignment(UUID workerId,String managerId,String note,String orderNumber) {}
    @PutMapping("/{id}") @Transactional
    public ReservationWork assign(@PathVariable UUID id,@RequestHeader("X-Service-Token") String supplied,@RequestBody Assignment input) {
        authorize(supplied);var existing=work.lock(id);
        if(existing.isPresent()) {
            if(!existing.get().getWorkerId().equals(input.workerId())) throw new ResponseStatusException(HttpStatus.CONFLICT,"A worker is already assigned");
            return existing.get();
        }
        var worker=workers.findById(input.workerId()).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND));
        if(worker.getVerification()==null || worker.getVerification().getNewStatus()!=WorkerVerification.VerificationStatus.APPROVED) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Worker must be approved");
        if(input.managerId()==null || input.note()==null || input.note().isBlank() || input.note().length()>1000) throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        var profile=auth.userInfo(worker.getUserId()).getBody();
        if(profile==null || !(profile.get("auth") instanceof Map<?,?> user) || user.get("fullName")==null) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"Worker name unavailable");
        var row=new ReservationWork();row.setOrderId(id);row.setWorkerId(input.workerId());row.setManagerId(input.managerId());row.setNote(input.note());row.setWorkerName(user.get("fullName").toString());
        row.setOrderNumber(input.orderNumber());return work.saveAndFlush(row);
    }
    @PutMapping("/{id}/status") @Transactional
    public ReservationWork status(@PathVariable UUID id,@RequestHeader("X-Service-Token") String supplied,@RequestBody Map<String,String> body) {
        authorize(supplied);var row=work.lock(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND));
        String target=body.get("status");if(row.getStatus().equals(target)) return row;
        if(!((Set.of("ASSIGNED","COMPLETED").contains(row.getStatus()) && "IN_PROGRESS".equals(target)) || ("IN_PROGRESS".equals(row.getStatus()) && "COMPLETED".equals(target)))) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid production transition");
        row.setStatus(target);row.setUpdatedAt(Instant.now());return work.save(row);
    }
}
