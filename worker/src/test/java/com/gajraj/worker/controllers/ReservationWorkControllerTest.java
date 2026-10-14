package com.gajraj.worker.controllers;
import com.gajraj.worker.model.*;
import com.gajraj.worker.repo.*;
import com.gajraj.worker.feign.ConnectionInterface;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
class ReservationWorkControllerTest {
    final ReservationWorkRepo repo=mock(ReservationWorkRepo.class);
    final WorkerRepo workers=mock(WorkerRepo.class);
    final ConnectionInterface auth=mock(ConnectionInterface.class);
    final ReservationWorkController controller=new ReservationWorkController(repo,workers,auth,"secret");
    @Test void assignmentRequiresApprovedWorkerAndIsIdempotent() {
        UUID id=UUID.randomUUID(),workerId=UUID.randomUUID();var worker=new Workers();worker.setUserId("user");
        var verification=new WorkerVerification();worker.setVerification(verification);
        when(workers.findById(workerId)).thenReturn(Optional.of(worker));
        var input=new ReservationWorkController.Assignment(workerId,"manager","Make the selected variant","ORES-2026-0001");
        assertThrows(ResponseStatusException.class,()->controller.assign(id,"wrong",input));
        assertThrows(ResponseStatusException.class,()->controller.assign(id,"secret",input));
        verification.setNewStatus(WorkerVerification.VerificationStatus.APPROVED);
        when(auth.userInfo("user")).thenReturn(ResponseEntity.ok(Map.of("auth",Map.of("fullName","Worker Name"))));
        when(repo.saveAndFlush(any())).thenAnswer(c->{ReservationWork row=c.getArgument(0);when(repo.lock(id)).thenReturn(Optional.of(row));return row;});
        var row=controller.assign(id,"secret",input);
        assertEquals("Worker Name",row.getWorkerName());assertSame(row,controller.assign(id,"secret",input));
        verify(repo,times(1)).saveAndFlush(any());
        assertThrows(ResponseStatusException.class,()->controller.status(id,"secret",Map.of("status","COMPLETED")));
        controller.status(id,"secret",Map.of("status","IN_PROGRESS"));
        controller.status(id,"secret",Map.of("status","COMPLETED"));assertEquals("COMPLETED",row.getStatus());
    }
}
