package com.gajraj.payment.service;
import com.gajraj.payment.entity.PaymentRecord;
import com.gajraj.payment.repository.PaymentRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
class BankTransferPaymentServiceTest {
    PaymentRepository repo=mock(PaymentRepository.class);
    BankTransferPaymentService service=new BankTransferPaymentService(repo,mock(JdbcTemplate.class));
    @Test void preservesPaiseAndRetriesWithoutDuplicateCredit() {
        when(repo.save(any())).thenAnswer(c->{PaymentRecord p=c.getArgument(0);when(repo.findFirstByOrderIdOrderByIdDesc("order")).thenReturn(Optional.of(p));return p;});
        service.sync("order",new BigDecimal("50000.75"),"customer");service.sync("order",new BigDecimal("50000.75"),"customer");
        verify(repo,times(1)).save(argThat(p->p.getBankAmount().equals(new BigDecimal("50000.75")) && p.getStatus()==PaymentRecord.PaymentStatus.PAID));
        assertThrows(IllegalStateException.class,()->service.sync("order",new BigDecimal("1"),"customer"));
        assertThrows(IllegalStateException.class,()->service.sync("order",new BigDecimal("50000.75"),"other"));
    }
    @Test void refusesInvalidAmount() {
        assertThrows(IllegalArgumentException.class,()->service.sync("order",new BigDecimal("-1"),"customer"));
        assertThrows(IllegalArgumentException.class,()->service.sync("order",new BigDecimal("10.001"),"customer"));verifyNoInteractions(repo);
    }
}
