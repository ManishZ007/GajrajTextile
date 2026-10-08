package com.gajraj.manager.service.managerService;
import com.gajraj.manager.repo.ManagerOrderFlowRepo;
import com.gajraj.manager.model.ManagerOrderFlow;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.util.ReflectionTestUtils;
import java.util.*;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;
class OrderFlowRetryTest {
    @Test void repeatedDeliveryDoesNotDuplicateManagerFlow() {
        var repo=mock(ManagerOrderFlowRepo.class);var service=new OrderFlowService();
        ReflectionTestUtils.setField(service,"managerOrderFlowRepo",repo);
        ReflectionTestUtils.setField(service,"jdbc",mock(JdbcTemplate.class));
        when(repo.save(any())).thenAnswer(call->{
            ManagerOrderFlow flow=call.getArgument(0);flow.setId(UUID.randomUUID());
            when(repo.findByOrderId("order")).thenReturn(Optional.of(flow));return flow;
        });
        var request=Map.of("orderId","order","addressId","11");
        assertTrue(service.createOrderFlow(request).getStatusCode().is2xxSuccessful());
        assertTrue(service.createOrderFlow(request).getStatusCode().is2xxSuccessful());
        verify(repo,times(1)).save(any());
    }
}
