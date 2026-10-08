package com.gajraj.product.repo;
import com.gajraj.product.model.StockReservation;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.*;
public interface StockReservationRepo extends JpaRepository<StockReservation, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from StockReservation r where r.orderId = :id")
    Optional<StockReservation> lock(@Param("id") UUID id);
    List<StockReservation> findTop100ByStateAndExpiresAtBefore(StockReservation.State state, Instant time);
}
