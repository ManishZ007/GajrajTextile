package com.gajraj.order.service;
import com.gajraj.order.repo.OrdersRepo;
import org.springframework.stereotype.Component;
import org.springframework.scheduling.annotation.Scheduled;
@Component
public class OrderIntegrationJob {
    private final OrdersRepo orders;
    private final OrderIntegrationService service;
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(OrderIntegrationJob.class);
    public OrderIntegrationJob(OrdersRepo orders, OrderIntegrationService service) {this.orders=orders; this.service=service;}
    @Scheduled(fixedDelayString="${order.integration.retry-ms:5000}")
    public void retry() {
        for (var order : orders.findTop100ByIntegrationPendingTrueOrderByUpdatedAtAsc()) {
            try { service.sync(order.getId()); }
            catch (Exception e) {log.warn("Order integration pending for {}: {}", order.getId(), e.getMessage());}
        }
    }
}
