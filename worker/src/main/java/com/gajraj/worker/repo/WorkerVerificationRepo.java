package com.gajraj.worker.repo;

import com.gajraj.worker.model.WorkerVerification;
import com.gajraj.worker.model.Workers;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface WorkerVerificationRepo extends JpaRepository<WorkerVerification, UUID> {
    Optional<WorkerVerification> findByWorkerId(String workerId);

}
