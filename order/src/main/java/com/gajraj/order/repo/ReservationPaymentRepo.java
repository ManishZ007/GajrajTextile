package com.gajraj.order.repo;
import com.gajraj.order.model.ReservationPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface ReservationPaymentRepo extends JpaRepository<ReservationPayment,UUID> {
    List<ReservationPayment> findByReservationIdOrderBySubmittedAtAsc(UUID id);
    boolean existsByReservationIdAndStatus(UUID id,String status);
}
