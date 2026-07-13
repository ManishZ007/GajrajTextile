package com.gajraj.manager.repo;


import com.gajraj.manager.model.ManagerOrderAssignments;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ManagerOrderAssignmentRepo extends JpaRepository<ManagerOrderAssignments, UUID> {
}
