package com.gajraj.product.service;
import com.gajraj.product.repo.StockReservationRepo;
import com.gajraj.product.model.StockReservation;
import org.springframework.stereotype.Component;
import org.springframework.scheduling.annotation.Scheduled;
import java.time.Instant;
@Component
public class ReservationExpiryJob {
    private final StockReservationRepo repo;
    private final StockReservationService service;
    public ReservationExpiryJob(StockReservationRepo repo, StockReservationService service) { this.repo=repo; this.service=service; }
    @Scheduled(fixedDelayString="${stock.reservation.sweep-ms:30000}")
    public void expire() {
        for (var r : repo.findTop100ByStateAndExpiresAtBefore(StockReservation.State.HELD, Instant.now())) {
            try { service.release(r.getOrderId(), true); }
            catch (RuntimeException e) { org.slf4j.LoggerFactory.getLogger(getClass()).error("Reservation expiry failed: {}", r.getOrderId(), e); }
        }
    }
}
