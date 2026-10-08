package com.gajraj.shipping.service;
import org.springframework.stereotype.Component;
import org.springframework.scheduling.annotation.Scheduled;
import com.gajraj.shipping.repo.ShipmentRepo;
@Component
public class ShippingSyncJob {
    private final ShipmentRepo repo; private final ShippingService service;
    public ShippingSyncJob(ShipmentRepo repo, ShippingService service) { this.repo=repo; this.service=service; }
    @Scheduled(fixedDelayString="${shipping.sync-delay-ms:5000}")
    public void sync() {
        for (var s : repo.findTop100ByOrderSyncPendingTrueOrderByUpdatedAtAsc()) {
            try { service.syncOrder(s.getId()); }
            catch (RuntimeException e) { org.slf4j.LoggerFactory.getLogger(getClass()).warn("Shipment order sync pending for {}", s.getId()); }
        }
    }
}
