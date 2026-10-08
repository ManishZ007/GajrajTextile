package com.gajraj.payment.service;
import com.gajraj.payment.entity.PaymentRecord;
import com.gajraj.payment.repository.PaymentRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
class CodPaymentServiceTest {
    private final PaymentRepository repo=mock(PaymentRepository.class);
    private final CodPaymentService service=new CodPaymentService(repo,mock(JdbcTemplate.class));
    @Test void pendingThenCollectedKeepsExactCashAmountAndSingleRecord() {
        var record=new PaymentRecord();when(repo.findFirstByOrderIdOrderByIdDesc("id")).thenReturn(Optional.of(record));
        service.sync("id",new BigDecimal("100.50"),"customer","COD_PENDING");
        assertEquals(PaymentRecord.PaymentStatus.COD_PENDING,record.getStatus());
        assertEquals(new BigDecimal("100.50"),record.getCodAmount());
        record.setId(1L);service.sync("id",new BigDecimal("100.50"),"customer","PAID");
        service.sync("id",new BigDecimal("100.50"),"customer","PAID");verify(repo,times(2)).save(record);
        assertThrows(IllegalStateException.class,()->service.sync("id",BigDecimal.TEN,"customer","COD_PENDING"));
    }
    @Test void cancellationIsIdempotentAndCannotBecomePaid() {
        var r=new PaymentRecord();when(repo.findFirstByOrderIdOrderByIdDesc("id")).thenReturn(Optional.of(r));
        service.sync("id",BigDecimal.TEN,"customer","CANCELLED");service.sync("id",BigDecimal.TEN,"customer","CANCELLED");
        verify(repo,times(1)).save(r);
        assertThrows(IllegalStateException.class,()->service.sync("id",BigDecimal.TEN,"customer","PAID"));
    }
    @Test void rejectsInvalidAmount() {
        assertThrows(IllegalArgumentException.class,()->service.sync("id",new BigDecimal("29001"),"customer","COD_PENDING"));
        verifyNoInteractions(repo);
    }
}
