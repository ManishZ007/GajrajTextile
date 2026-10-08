package com.gajraj.worker.service.workerService;
import com.gajraj.worker.model.*;
import com.gajraj.worker.repo.*;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
class WorkerAttributionTest {
    @Test void approvingPreservesOriginalCreator() {
        var repo = mock(WorkerRepo.class); var logs = mock(WorkerVerificationRepo.class);
        var service = new WorkerService(); service.workerRepo = repo; service.workerVerificationRepo = logs;
        var worker = new Workers(); worker.setWorkerId(UUID.randomUUID());
        var initial = new WorkerVerification(); initial.setReason("Initial registration"); initial.setChangeBy("creator"); worker.setVerification(initial);
        when(repo.findById(worker.getWorkerId())).thenReturn(Optional.of(worker));
        when(logs.save(any())).thenAnswer(i -> i.getArgument(0)); when(repo.save(any())).thenAnswer(i -> i.getArgument(0));
        service.updateVerificationStatus(worker.getWorkerId(), "APPROVED", "approver", "Checked");
        assertEquals("creator", worker.getCreatedByManagerId());
        assertEquals("approver", worker.getVerification().getChangeBy());
        assertEquals(WorkerVerification.VerificationStatus.APPROVED, worker.getVerification().getNewStatus());
        service.updateVerificationStatus(worker.getWorkerId(), "REJECTED", "another-manager", "Recheck");
        assertEquals("creator", worker.getCreatedByManagerId());
    }
    @Test void overwrittenCreatorIsNotGuessed() {
        var repo = mock(WorkerRepo.class); var logs = mock(WorkerVerificationRepo.class);
        var service = new WorkerService(); service.workerRepo = repo; service.workerVerificationRepo = logs;
        var worker = new Workers(); worker.setWorkerId(UUID.randomUUID());
        var decision = new WorkerVerification(); decision.setReason("Reviewed"); decision.setChangeBy("previous-reviewer"); worker.setVerification(decision);
        when(repo.findById(worker.getWorkerId())).thenReturn(Optional.of(worker)); when(logs.save(any())).thenAnswer(i -> i.getArgument(0));
        service.updateVerificationStatus(worker.getWorkerId(), "APPROVED", "approver", "Checked");
        assertNull(worker.getCreatedByManagerId());
    }
}
