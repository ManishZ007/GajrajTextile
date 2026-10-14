package com.gajraj.order.repo;
import com.gajraj.order.model.CustomerReservation;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.*;
import java.time.Instant;
import java.util.*;
public interface CustomerReservationRepo extends JpaRepository<CustomerReservation,UUID> {
    List<CustomerReservation> findTop100ByStockActionIsNotNullOrderByCreatedAtAsc();
    @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select r from CustomerReservation r where r.id=:id")
    Optional<CustomerReservation> lock(@Param("id") UUID id);
    Page<CustomerReservation> findByUserIdOrderByCreatedAtDesc(String userId, Pageable page);
    Page<CustomerReservation> findByType(String type,Pageable page);
    Page<CustomerReservation> findByUserIdAndType(String userId,String type,Pageable page);
    List<CustomerReservation> findTop100ByStatusAndHoldExpiresAtBefore(String status, Instant time);
}
