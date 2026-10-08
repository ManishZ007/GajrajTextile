package com.gajraj.payment.service;
import com.gajraj.payment.entity.PaymentRecord;
import com.gajraj.payment.repository.PaymentRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;

@Service
public class CodPaymentService {
    private final PaymentRepository records;
    private final JdbcTemplate jdbc;
    public CodPaymentService(PaymentRepository records, JdbcTemplate jdbc) {this.records=records; this.jdbc=jdbc;}
    @Transactional
    public void sync(String id, BigDecimal amount, String userId, String status) {
        if (amount == null || amount.signum() <= 0 || amount.compareTo(new BigDecimal("29000")) > 0 || userId == null || userId.isBlank())
            throw new IllegalArgumentException("Invalid COD payment");
        var target = PaymentRecord.PaymentStatus.valueOf(status);
        if (target != PaymentRecord.PaymentStatus.COD_PENDING && target != PaymentRecord.PaymentStatus.PAID && target != PaymentRecord.PaymentStatus.CANCELLED)
            throw new IllegalArgumentException("Invalid COD status");
        jdbc.execute((org.springframework.jdbc.core.ConnectionCallback<Void>) connection -> {
            try (var statement = connection.prepareStatement("select pg_advisory_xact_lock(hashtext(?))")) {
                statement.setString(1, "cod:" + id); statement.execute();
            } return null;
        });
        var record = records.findFirstByOrderIdOrderByIdDesc(id).orElseGet(PaymentRecord::new);
        if (record.getId() != null && (!"COD".equals(record.getPaymentMethod()) || !userId.equals(record.getUserId())))
            throw new IllegalStateException("Payment does not match COD order");
        if (record.getStatus() == PaymentRecord.PaymentStatus.PAID || record.getStatus() == PaymentRecord.PaymentStatus.CANCELLED) {
            if (record.getStatus() != target) throw new IllegalStateException("Cannot change finalized COD payment");
            return;
        }
        record.setOrderId(id); record.setUserId(userId); record.setPaymentMethod("COD");
        record.setCodAmount(amount); record.setAmount(amount.longValue()); record.setCurrency("INR");
        record.setStatus(target); record.setOrderConfirmed(true);
        records.save(record);
    }
}
