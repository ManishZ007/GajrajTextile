package com.gajraj.manager.controller;
import com.gajraj.manager.feign.OwnerWorkerClient;
import com.gajraj.manager.repo.ManagerOrderAssignmentRepo;
import com.gajraj.manager.model.ManagerOrderAssignments;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;
class OwnerActivityTest {
    @Test void combinesCreatedWorkersAndAssignmentsWithoutCountingOtherManagers() {
        var client=mock(OwnerWorkerClient.class);var repo=mock(ManagerOrderAssignmentRepo.class);
        var manager=UUID.randomUUID();var worker=UUID.randomUUID().toString();
        Map<String,Object> row=new HashMap<>();row.put("workerId",worker);row.put("createdByManager",true);row.put("assignments",new ArrayList<Map<String,Object>>());
        when(client.workers(manager.toString(),"Bearer owner")).thenReturn(List.of(row));
        var assignment=new ManagerOrderAssignments();assignment.setId(UUID.randomUUID());assignment.setWorkerId(worker);assignment.setOrderId(UUID.randomUUID().toString());
        when(repo.findByManagerIdOrderByAssignedAtDesc(manager.toString())).thenReturn(List.of(assignment));
        var result=new OwnerManagerActivityController(client,repo).workers(manager,"Bearer owner");
        assertEquals(1L,result.get("created"));assertEquals(1L,result.get("assignments"));
        assertEquals(1,((List<?>)result.get("items")).size());
        verify(repo).findByManagerIdOrderByAssignedAtDesc(manager.toString());
    }
    @Test void workerServiceFailureDoesNotBecomeEmptyStatistics() {
        var client=mock(OwnerWorkerClient.class);var repo=mock(ManagerOrderAssignmentRepo.class);var manager=UUID.randomUUID();
        when(client.workers(manager.toString(),"Bearer owner")).thenThrow(new IllegalStateException());
        assertThrows(IllegalStateException.class,()->new OwnerManagerActivityController(client,repo).workers(manager,"Bearer owner"));
    }
}
