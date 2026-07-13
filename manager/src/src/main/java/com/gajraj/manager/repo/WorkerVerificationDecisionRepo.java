package com.gajraj.manager.repo;

import com.gajraj.manager.model.WorkerVerificationDecision;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface WorkerVerificationDecisionRepo extends JpaRepository<WorkerVerificationDecision, UUID> {
}
