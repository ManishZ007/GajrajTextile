package com.gajraj.manager.repo;

import com.gajraj.manager.model.OwnerReports;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.UUID;

public interface OwnerReportsRepo extends JpaRepository<OwnerReports, UUID>, JpaSpecificationExecutor<OwnerReports> {

    long countByIsReadFalse();
    long countByApproveTrue();
    long countByApproveFalse();
    long countByReportType(OwnerReports.ReportType reportType);
    List<OwnerReports> findByReportTypeOrderByUpdatedAtDesc(OwnerReports.ReportType reportType);
}
