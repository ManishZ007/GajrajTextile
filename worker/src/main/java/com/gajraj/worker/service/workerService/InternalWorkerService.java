package com.gajraj.worker.service.workerService;

import com.gajraj.worker.dto.WorkerDTO.UpdateWorkerInDataBase;
import com.gajraj.worker.dto.WorkerDTO.UpdateWorkerProfileRequest;
import com.gajraj.worker.dto.userDTO.SaveUserReq;
import com.gajraj.worker.model.WorkerVerification;
import com.gajraj.worker.model.Workers;
import com.gajraj.worker.repo.WorkerRepo;
import com.gajraj.worker.repo.WorkerVerificationRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Service
public class InternalWorkerService {

    @Autowired
    WorkerRepo workerRepo;

    @Autowired
    WorkerVerificationRepo workerVerificationRepo;

    @Transactional
    public ResponseEntity<?> saveNewUser(SaveUserReq saveNewUserFromAuth) {
        try {
            System.out.println(saveNewUserFromAuth);
            Workers newUserData = new Workers();

            newUserData.setCreatedByManagerId(saveNewUserFromAuth.getManagerId());
            newUserData.setUserId(saveNewUserFromAuth.getUser_id());
            newUserData.setWorkerCode((long) (100000 + Math.random() * 900000));
            newUserData.setWorkExperience(saveNewUserFromAuth.getWorkExperience());

            if (saveNewUserFromAuth.getGender() != null) {
                newUserData.setGender(saveNewUserFromAuth.getGender());
            }
            if (saveNewUserFromAuth.getDateOfBirth() != null && !saveNewUserFromAuth.getDateOfBirth().isBlank()) {
                newUserData.setDateOfBirth(LocalDate.parse(saveNewUserFromAuth.getDateOfBirth()));
            }

            Workers savedWorker = workerRepo.save(newUserData);

            WorkerVerification verification = new WorkerVerification();
            verification.setWorkerId(savedWorker.getWorkerId().toString());
            verification.setOldStatus(WorkerVerification.VerificationStatus.PENDING);
            verification.setNewStatus(WorkerVerification.VerificationStatus.PENDING);
            verification.setChangeBy(saveNewUserFromAuth.getManagerId());
            verification.setChange_at(LocalDateTime.now());
            verification.setReason("Initial registration");
            WorkerVerification savedVerification = workerVerificationRepo.save(verification);

            savedWorker.setVerification(savedVerification);
            workerRepo.save(savedWorker);

            return ResponseEntity.ok(Map.of(
                    "message", "worker created successfully",
                    "workerId", savedWorker.getWorkerId().toString(),
                    "userId", savedWorker.getUserId()
            ));

        } catch (Exception e) {
            System.err.println("database error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "database error: " + e.getMessage()));
        }
    }


    public ResponseEntity<Map<String, Object>> deleteWorker(String userId) {
        try {
            Workers worker = workerRepo.findByUserId(userId);   // or use whatever finder you have
            if (worker == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "worker not found for user_id: " + userId));
            }
            workerRepo.delete(worker);
            return ResponseEntity.ok(Map.of(
                    "message", "worker deleted successfully",
                    "user_id", userId
            ));
        } catch (Exception e) {
            System.err.println("worker delete error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "worker delete error: " + e.getMessage()));
        }
    }


    public ResponseEntity<?> updateWorker(String workerId, UpdateWorkerProfileRequest workerProfileRequest) {
        try {
            UpdateWorkerInDataBase workerPayload = new UpdateWorkerInDataBase();
            workerPayload.setWorker_experience(workerProfileRequest.getWorker_experience());
            workerPayload.setWorker_profile_image(workerProfileRequest.getWorker_profile_image());
            workerPayload.setUpdatedAt(LocalDateTime.now());
            workerPayload.setGender(workerProfileRequest.getGender());

            LocalDate dob = null;
            String dobString = workerProfileRequest.getDate_of_birth();
            if (dobString != null && !dobString.trim().isEmpty()) {
                dob = LocalDate.parse(dobString);
            }
            workerPayload.setDate_of_birth(dob);

            int workerUpdateCheck = workerRepo.updateCustomerProfileInfo(UUID.fromString(workerId), workerPayload);
            if (workerUpdateCheck > 0) {
                Workers worker = workerRepo.findById(UUID.fromString(workerId))
                        .orElseThrow(() -> new RuntimeException("failed to fetch updated worker"));
                return ResponseEntity.ok(Map.of(
                        "message", "worker update successfully",
                        "worker_id", worker.getWorkerId().toString(),
                        "user_id", worker.getUserId()
                ));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "worker not found or no fields changed"));
            }

        } catch (Exception e) {
            System.err.println("worker update error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "worker update error: " + e.getMessage()));
        }
    }


}