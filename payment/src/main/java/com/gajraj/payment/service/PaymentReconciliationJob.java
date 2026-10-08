package com.gajraj.payment.service;
import com.gajraj.payment.repository.PaymentRepository;
import org.springframework.stereotype.Component;
import org.springframework.scheduling.annotation.Scheduled;
import java.time.LocalDateTime;
@Component
public class PaymentReconciliationJob {
    private final PaymentRepository repo;
    private final PaymentService service;
    public PaymentReconciliationJob(PaymentRepository repo, PaymentService service){this.repo=repo;this.service=service;}
    @Scheduled(fixedDelayString="${payment.reconcile-ms:30000}")
    public void reconcile() {
        for(var r:repo.findByCreatedAtAfterAndOrderConfirmedFalse(LocalDateTime.now().minusDays(1))) {
            if(r.getUserId()==null || r.getRazorpayOrderId()==null) continue;
            try { service.reconcile(r.getRazorpayOrderId()); }
            catch(Exception e){ org.slf4j.LoggerFactory.getLogger(getClass()).error("Payment reconciliation requires attention for order {}: {}",r.getOrderId(),e.getMessage()); }
        }
    }
}
