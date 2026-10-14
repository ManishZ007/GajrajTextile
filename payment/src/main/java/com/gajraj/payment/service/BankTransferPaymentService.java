package com.gajraj.payment.service;

import com.gajraj.payment.entity.PaymentRecord;
import com.gajraj.payment.repository.PaymentRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;

@Service
public class BankTransferPaymentService {
    private final PaymentRepository records;
    private final JdbcTemplate jdbc;
    public BankTransferPaymentService(PaymentRepository records, JdbcTemplate jdbc) { this.records=records; this.jdbc=jdbc; }
    @Transactional
    public void sync(String id, BigDecimal amount, String userId) {
        if (amount==null || amount.signum()<=0 || amount.scale()>2 || amount.compareTo(new BigDecimal("99999999.99"))>0 || userId==null || userId.isBlank())
            throw new IllegalArgumentException("Invalid bank payment");
        jdbc.execute((org.springframework.jdbc.core.ConnectionCallback<Void>) connection -> {
            try(var statement=connection.prepareStatement("select pg_advisory_xact_lock(hashtext(?))")) {
                statement.setString(1,"bank:"+id); statement.execute();
            } return null;
        });
        var existing=records.findFirstByOrderIdOrderByIdDesc(id);
        if(existing.isPresent()) {
            var record=existing.get();
            if(!"BANK_TRANSFER".equals(record.getPaymentMethod()) || !userId.equals(record.getUserId())
                    || record.getBankAmount()==null || amount.compareTo(record.getBankAmount())!=0 || record.getStatus()!=PaymentRecord.PaymentStatus.PAID)
                throw new IllegalStateException("Conflicting finalized bank payment");
            return;
        }
        var record=new PaymentRecord(); record.setOrderId(id); record.setUserId(userId);
        record.setBankAmount(amount); record.setAmount(amount.longValue()); record.setCurrency("INR");
        record.setPaymentMethod("BANK_TRANSFER"); record.setStatus(PaymentRecord.PaymentStatus.PAID);
        record.setOrderConfirmed(true); records.save(record);
    }
}
