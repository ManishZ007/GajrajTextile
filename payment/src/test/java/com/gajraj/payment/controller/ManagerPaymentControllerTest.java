package com.gajraj.payment.controller;

import com.gajraj.payment.repository.PaymentRepository;
import com.gajraj.payment.entity.PaymentRecord;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ManagerPaymentControllerTest {
    private final PaymentRepository repository = mock(PaymentRepository.class);
    private final ManagerPaymentController controller = new ManagerPaymentController(repository);

    @Test void missingRecordIsNotReportedAsPending() {
        when(repository.findFirstByOrderIdOrderByIdDesc("order")).thenReturn(Optional.empty());
        assertEquals(404, controller.summary("order").getStatusCode().value());
    }
    @Test void codPreservesExactAmount() {
        PaymentRecord record = new PaymentRecord();
        record.setPaymentMethod("COD");
        record.setCodAmount(new BigDecimal("123.45"));
        record.setStatus(PaymentRecord.PaymentStatus.COD_PENDING);
        when(repository.findFirstByOrderIdOrderByIdDesc("order")).thenReturn(Optional.of(record));
        assertEquals(new BigDecimal("123.45"), controller.summary("order").getBody().amount());
    }
    @Test void onlineReturnsRecordedStatusAndTransactionId() {
        PaymentRecord record = new PaymentRecord();
        record.setPaymentMethod("CARD"); record.setAmount(18000L);
        record.setStatus(PaymentRecord.PaymentStatus.PAID); record.setRazorpayPaymentId("pay_test");
        when(repository.findFirstByOrderIdOrderByIdDesc("order")).thenReturn(Optional.of(record));
        var summary = controller.summary("order").getBody();
        assertEquals("PAID", summary.status()); assertEquals("pay_test", summary.paymentId());
        assertEquals(new BigDecimal("18000"), summary.amount());
    }
}
