package com.gajraj.manager.repo;


import com.gajraj.manager.model.OrderHoldCases;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface OrderHoldCasesRepo extends JpaRepository<OrderHoldCases, UUID> {
}
