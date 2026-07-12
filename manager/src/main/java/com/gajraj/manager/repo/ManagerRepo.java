package com.gajraj.manager.repo;

import com.gajraj.manager.model.Managers;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface ManagerRepo extends JpaRepository<Managers, UUID> {

    @Query(value = """
            SELECT m FROM Managers m WHERE m.userId = :userId
            """)
    Managers findManagerByUserId(
            @Param("userId") String userId
    );

}
