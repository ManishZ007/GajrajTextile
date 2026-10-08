package com.gajraj.manager.repo;
import com.gajraj.manager.model.ManagerOrderFlow;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
class OrderFlowDuplicateTest {
    private ManagerOrderFlow initial() {
        var flow=new ManagerOrderFlow();flow.setProductStstus(ManagerOrderFlow.ProductStatus.NOT_STARTED);
        flow.setQualityCheck(ManagerOrderFlow.QualityCheck.PENDING);flow.setShippingStatus(ManagerOrderFlow.ShippingStatus.NOT_READY);return flow;
    }
    private ManagerOrderFlowRepo repo(List<ManagerOrderFlow> flows) {
        var repo=mock(ManagerOrderFlowRepo.class);when(repo.findAllByOrderIdOrderByUpdatedAtAscIdAsc("order")).thenReturn(flows);
        when(repo.findByOrderId("order")).thenCallRealMethod();return repo;
    }
    @Test void workedOnFlowWinsOverAnEmptyDuplicate() {
        var empty=initial();var completed=initial();completed.setProductStstus(ManagerOrderFlow.ProductStatus.COMPLETED);
        completed.setShippingStatus(ManagerOrderFlow.ShippingStatus.SHIPPED);
        assertSame(completed,repo(List.of(empty,completed)).findByOrderId("order").orElseThrow());
        assertSame(completed,repo(List.of(completed,empty)).findByOrderId("order").orElseThrow());
    }
    @Test void initialRetriesUseOldestRecord() {
        var first=initial();assertSame(first,repo(List.of(first,initial())).findByOrderId("order").orElseThrow());
    }
    @Test void missingFlowRemainsMissing() {assertTrue(repo(List.of()).findByOrderId("order").isEmpty());}
}
