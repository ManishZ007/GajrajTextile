package com.gajraj.worker.service.workerService;


import com.gajraj.worker.model.WorkerVerification;
import com.gajraj.worker.model.Workers;
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
import java.util.UUID;


@Service
public class WorkerService {

    @Autowired
    WorkerRepo workerRepo;

    @Autowired
    WorkerVerificationRepo workerVerificationRepo;


    public ResponseEntity<?> getWorker(String user_id) {
        Workers worker = workerRepo.findWorkerByUserId(user_id);
        return ResponseEntity.ok(worker);
    }


    @Transactional(readOnly = true)
    public Page<Workers> getAllWorkers(int page, int size, String status) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return workerRepo.findAll(pageable);
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
