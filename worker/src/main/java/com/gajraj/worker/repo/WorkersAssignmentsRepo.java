package com.gajraj.worker.repo;

import com.gajraj.worker.model.WorkersAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface WorkersAssignmentsRepo extends JpaRepository<WorkersAssignment, UUID> {
}
