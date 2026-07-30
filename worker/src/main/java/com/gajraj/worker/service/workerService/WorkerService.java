package com.gajraj.worker.service.workerService;


import com.gajraj.worker.feign.ConnectionInterface;
import com.gajraj.worker.model.*;
import com.gajraj.worker.repo.WorkerRepo;

import com.gajraj.worker.repo.WorkerVerificationRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;


@Service
public class WorkerService {

    @Autowired
    WorkerRepo workerRepo;

    @Autowired
    WorkerVerificationRepo workerVerificationRepo;

    @Autowired
    ConnectionInterface connectionInterface;


    @Transactional(readOnly = true)
    public ResponseEntity<?> getWorker(String user_id) {
        Workers worker = workerRepo.findWorkerByUserId(user_id);
        if (worker == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(buildWorkerFullResponse(worker));

    }

    private Map<String, Object> buildWorkerBasicResponse(Workers worker) {
        Map<String, Object> workerMap = new LinkedHashMap<>();
        workerMap.put("workerId", worker.getWorkerId());
        workerMap.put("userId", worker.getUserId());
        workerMap.put("workExperience", worker.getWorkExperience());
        workerMap.put("workerCode", worker.getWorkerCode());
        workerMap.put("workerProfileImage", worker.getWorkerProfileImage());
        workerMap.put("gender", worker.getGender());
        workerMap.put("dateOfBirth", worker.getDateOfBirth());
        workerMap.put("createdAt", worker.getCreatedAt());
        workerMap.put("updatedAt", worker.getUpdatedAt());
        WorkerVerification v = worker.getVerification();
        if (v != null) {
            Map<String, Object> verMap = new LinkedHashMap<>();
            verMap.put("id", v.getId());
            verMap.put("oldStatus", v.getOldStatus());
            verMap.put("newStatus", v.getNewStatus());
            verMap.put("changeBy", v.getChangeBy());
            verMap.put("changeAt", v.getChange_at());
            verMap.put("reason", v.getReason());
            workerMap.put("verification", verMap);
        } else {
            workerMap.put("verification", null);
        }
        return workerMap;
    }

    private Map<String, Object> buildWorkerFullResponse(Workers worker) {
        Map<String, Object> workerMap = new LinkedHashMap<>();
        workerMap.put("workerId", worker.getWorkerId());
        workerMap.put("userId", worker.getUserId());
        workerMap.put("workExperience", worker.getWorkExperience());
        workerMap.put("workerCode", worker.getWorkerCode());
        workerMap.put("workerProfileImage", worker.getWorkerProfileImage());
        workerMap.put("gender", worker.getGender());
        workerMap.put("dateOfBirth", worker.getDateOfBirth());
        workerMap.put("createdAt", worker.getCreatedAt());
        workerMap.put("updatedAt", worker.getUpdatedAt());

        // verification
        WorkerVerification v = worker.getVerification();
        if (v != null) {
            Map<String, Object> verMap = new LinkedHashMap<>();
            verMap.put("id", v.getId());
            verMap.put("oldStatus", v.getOldStatus());
            verMap.put("newStatus", v.getNewStatus());
            verMap.put("changeBy", v.getChangeBy());
            verMap.put("changeAt", v.getChange_at());
            verMap.put("reason", v.getReason());
            workerMap.put("verification", verMap);
        } else {
            workerMap.put("verification", null);
        }

        // assignments with all nested tables
        List<Map<String, Object>> assignmentsList = new ArrayList<>();
        if (worker.getAssignments() != null) {
            for (WorkersAssignment a : worker.getAssignments()) {
                Map<String, Object> assignMap = new LinkedHashMap<>();
                assignMap.put("id", a.getId());
                assignMap.put("orderId", a.getOrderId());
                assignMap.put("assignedBy", a.getAssignedBy());
                assignMap.put("assignedDate", a.getAssignedDate());
                assignMap.put("status", a.getStatus());
                assignMap.put("createdAt", a.getCreatedAt());
                assignMap.put("updatedAt", a.getUpdatedAt());

                // worker_progress
                WorkerProgress p = a.getProgress();
                if (p != null) {
                    Map<String, Object> progressMap = new LinkedHashMap<>();
                    progressMap.put("id", p.getId());
                    progressMap.put("assignmentId", p.getAssignmentId());
                    progressMap.put("progressPercent", p.getProgressPercent());
                    progressMap.put("currentStep", p.getCurrentStep());
                    progressMap.put("updatedAt", p.getUpdatedAt());
                    assignMap.put("progress", progressMap);
                } else {
                    assignMap.put("progress", null);
                }

                // worker_performance
                WorkerPerformance perf = a.getPerformance();
                if (perf != null) {
                    Map<String, Object> perfMap = new LinkedHashMap<>();
                    perfMap.put("id", perf.getId());
                    perfMap.put("workerId", perf.getWorkerId());
                    perfMap.put("pointGet", perf.getPointGet());
                    perfMap.put("penaltyPoints", perf.getPenaltyPoints());
                    perfMap.put("evaluatedBy", perf.getEvaluatedBy());
                    perfMap.put("evaluatedAt", perf.getEvaluatedAt());
                    assignMap.put("performance", perfMap);
                } else {
                    assignMap.put("performance", null);
                }

                // material_usage_for_order + materials
                MaterialUsageForOrder usage = a.getMaterialUsage();
                if (usage != null) {
                    Map<String, Object> usageMap = new LinkedHashMap<>();
                    usageMap.put("id", usage.getId());
                    usageMap.put("workerId", usage.getWorkerId());
                    usageMap.put("orderId", usage.getOrderId());
                    usageMap.put("materialId", usage.getMaterialId());
                    usageMap.put("reportedAt", usage.getReportedAt());
                    usageMap.put("assignedMaterialBy", usage.getAssignedMaterialBy());

                    Materials mat = usage.getMaterial();
                    if (mat != null) {
                        Map<String, Object> matMap = new LinkedHashMap<>();
                        matMap.put("id", mat.getId());
                        matMap.put("zari", mat.getZari());
                        matMap.put("silk", mat.getSilk());
                        matMap.put("zariType", mat.getZaritype());
                        usageMap.put("material", matMap);
                    } else {
                        usageMap.put("material", null);
                    }

                    assignMap.put("materialUsage", usageMap);
                } else {
                    assignMap.put("materialUsage", null);
                }

                assignmentsList.add(assignMap);
            }
        }
        workerMap.put("assignments", assignmentsList);

        return workerMap;
    }


    @Transactional(readOnly = true)
    public Map<String, Object> getAllWorkers(int page, int size, String status) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Workers> workersPage = workerRepo.findAll(pageable);

        List<Map<String, Object>> combined = workersPage.getContent().stream()
                .map(worker -> {
                    Map<String, Object> entry = new HashMap<>();
                    entry.put("worker", buildWorkerBasicResponse(worker));
                    try {
                        ResponseEntity<Map<String, Object>> userResponse = connectionInterface.userInfo(worker.getUserId());
                        entry.put("user", userResponse.getBody());
                    } catch (Exception e) {
                        entry.put("user", null);
                    }
                    return entry;
                })
                .collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("workers", combined);
        result.put("totalElements", workersPage.getTotalElements());
        result.put("totalPages", workersPage.getTotalPages());
        result.put("currentPage", workersPage.getNumber());
        result.put("size", workersPage.getSize());

        return result;
    }


    @Transactional
    public Workers updateVerificationStatus(UUID workerId, String status, String changeBy, String reason) {
        Workers worker = workerRepo.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Worker not found"));

        WorkerVerification verification = worker.getVerification();

        WorkerVerification.VerificationStatus newStatus = WorkerVerification.VerificationStatus.valueOf(status);

        if (verification == null) {
            verification = new WorkerVerification();
            verification.setWorkerId(workerId.toString());
            verification.setOldStatus(WorkerVerification.VerificationStatus.PENDING);
        } else {
            verification.setOldStatus(verification.getNewStatus());
        }

        verification.setNewStatus(newStatus);
        verification.setChangeBy(changeBy);
        verification.setChange_at(LocalDateTime.now());
        verification.setReason(reason);

        WorkerVerification saved = workerVerificationRepo.save(verification);
        worker.setVerification(saved);
        return workerRepo.save(worker);
    }




}
