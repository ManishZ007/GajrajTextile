package com.gajraj.manager.repo;

import com.gajraj.manager.model.WorkerPerformanceActions;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface WorkerPerformanceActionRepo extends JpaRepository<WorkerPerformanceActions, UUID> {
}
