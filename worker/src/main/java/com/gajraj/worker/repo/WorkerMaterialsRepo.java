package com.gajraj.worker.repo;

import com.gajraj.worker.model.Materials;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface WorkerMaterialsRepo extends JpaRepository<Materials, UUID> {
}
