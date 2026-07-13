package com.gajraj.manager.repo;

import com.gajraj.manager.model.CustomerSupportCase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.UUID;

public interface CustomerSupportCaseRepo extends JpaRepository<CustomerSupportCase, UUID>, JpaSpecificationExecutor<CustomerSupportCase> {

    long countByStatus(CustomerSupportCase.CaseStatus status);
}
