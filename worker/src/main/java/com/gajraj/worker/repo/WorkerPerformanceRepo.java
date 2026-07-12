package com.gajraj.worker.repo;

import com.gajraj.worker.model.WorkerPerformance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface WorkerPerformanceRepo extends JpaRepository<WorkerPerformance, UUID> {

}
