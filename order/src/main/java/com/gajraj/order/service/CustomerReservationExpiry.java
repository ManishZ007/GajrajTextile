package com.gajraj.order.service;
import org.springframework.stereotype.Component;
import org.springframework.scheduling.annotation.Scheduled;
import com.gajraj.order.repo.CustomerReservationRepo;
import java.time.Instant;
@Component
public class CustomerReservationExpiry {
    private final CustomerReservationRepo repo;
    private final CustomerReservationService service;
    public CustomerReservationExpiry(CustomerReservationRepo repo,CustomerReservationService service) { this.repo=repo; this.service=service; }
    @Scheduled(fixedDelay=15000)
    public void run() {
        for(var r:repo.findTop100ByStockActionIsNotNullOrderByCreatedAtAsc()) {
            try { service.syncStock(r.getId()); }
            catch(Exception e) { org.slf4j.LoggerFactory.getLogger(getClass()).warn("Reservation {} stock synchronization will retry",r.getId()); }
        }
        for(var r:repo.findTop100ByStatusAndHoldExpiresAtBefore("AWAITING_DEPOSIT",Instant.now())) {
            try { service.expire(r.getId()); }
            catch(Exception e) { org.slf4j.LoggerFactory.getLogger(getClass()).warn("Reservation {} expiry will retry",r.getId()); }
        }
    }
}
