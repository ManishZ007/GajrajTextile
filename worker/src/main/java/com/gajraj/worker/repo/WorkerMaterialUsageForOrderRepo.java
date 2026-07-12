package com.gajraj.worker.repo;

import com.gajraj.worker.model.MaterialUsageForOrder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface WorkerMaterialUsageForOrderRepo extends JpaRepository<MaterialUsageForOrder, UUID> {
}
