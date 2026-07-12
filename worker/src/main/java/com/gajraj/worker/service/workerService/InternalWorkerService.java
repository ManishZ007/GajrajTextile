package com.gajraj.worker.service.workerService;

import com.gajraj.worker.dto.WorkerDTO.UpdateWorkerInDataBase;
import com.gajraj.worker.dto.WorkerDTO.UpdateWorkerProfileRequest;
import com.gajraj.worker.dto.userDTO.SaveUserReq;
import com.gajraj.worker.model.Workers;
import com.gajraj.worker.repo.WorkerRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Service
public class InternalWorkerService {

    @Autowired
    WorkerRepo workerRepo;

    public ResponseEntity<?> saveNewUser(SaveUserReq saveNewUserFromAuth) {

        try {

            Workers newUserData = new Workers();

            newUserData.setUserId(saveNewUserFromAuth.getUser_id());

            Workers saveWorker = workerRepo.save(newUserData);

            if(saveWorker != null) {
                return ResponseEntity.ok(
                        Map.of(
                                "message", "worker created successfully",
                                "worker" , saveWorker
                        )
                ) ;
            }else return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    Map.of(
                            "message", "something went wrong happen in worker database"
                    )
            );

        }catch (Exception e) {
            System.err.println("data base error" + e.getMessage());
        }

        return ResponseEntity.ok("worker save successfully");

    }


    public ResponseEntity<?> updateWorker(String workerId, UpdateWorkerProfileRequest workerProfileRequest) {
        try {

            System.out.println(workerProfileRequest);

            UpdateWorkerInDataBase workerPayload = new UpdateWorkerInDataBase();
            workerPayload.setWorker_experience(workerProfileRequest.getWorker_experience());
            workerPayload.setWorker_profile_image(workerProfileRequest.getWorker_profile_image());
            workerPayload.setUpdatedAt(LocalDateTime.now());
            workerPayload.setGender(workerProfileRequest.getGender());

            LocalDate dob = null;
            String dobString = workerProfileRequest.getDate_of_birth();

            if(dobString != null && !dobString.trim().isEmpty()) {
                dob = LocalDate.parse(dobString);
            }
            workerPayload.setDate_of_birth(dob);

            System.out.println(workerPayload);

            int workerUpdateCheck = workerRepo.updateCustomerProfileInfo(UUID.fromString(workerId), workerPayload);
            if(workerUpdateCheck > 0) {
                Workers worker = workerRepo.findById(UUID.fromString(workerId)).orElseThrow(() ->  new RuntimeException("something happen while fetching updated worker in worker-internal-service"));
                return ResponseEntity.ok(Map.of(
                    "message", "worker update successfully",
                    "worker", worker
                ));
            }else {
                throw new RuntimeException("update failed in worker-internal-service");
            }

        }catch (Exception e) {
            return ResponseEntity.ok("Hello this is an error ");
        }
    }

}
