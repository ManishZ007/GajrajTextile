package com.gajraj.worker.repo;
import com.gajraj.worker.model.ReservationWork;
import java.util.*;
import org.springframework.data.jpa.repository.*;
public interface ReservationWorkRepo extends JpaRepository<ReservationWork,UUID> {
    List<ReservationWork> findByWorkerIdOrderByAssignedAtDesc(UUID workerId);
    @Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("select w from ReservationWork w where w.orderId=:id")
    Optional<ReservationWork> lock(@org.springframework.data.repository.query.Param("id") UUID id);
}
