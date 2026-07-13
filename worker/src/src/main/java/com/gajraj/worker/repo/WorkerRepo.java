package com.gajraj.worker.repo;


import com.gajraj.worker.dto.WorkerDTO.UpdateWorkerInDataBase;
import com.gajraj.worker.model.Workers;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface  WorkerRepo extends JpaRepository<Workers, UUID> {

    @Query("""
        SELECT w FROM Workers w WHERE w.userId = :userId
       """)
    Workers findWorkerByUserId(
            @Param("userId") String userId
    );



    @Modifying
    @Transactional
    @Query("""
    UPDATE Workers w
    SET 
        w.gender = COALESCE(:#{#req.gender}, w.gender),
        w.dateOfBirth = COALESCE(:#{#req.date_of_birth}, w.dateOfBirth),
        w.workerProfileImage = COALESCE(:#{#req.worker_profile_image}, w.workerProfileImage),
        w.updatedAt = COALESCE(:#{#req.updatedAt}, w.updatedAt),
        w.workExperience = COALESCE(:#{#req.worker_experience}, w.workExperience)
    WHERE w.workerId = :worker_id
    """)
    int updateCustomerProfileInfo(
            @Param("worker_id") UUID worker_id,
            @Param("req") UpdateWorkerInDataBase req
    );



}
