package com.gajraj.worker.controllers;


import com.gajraj.worker.dto.WorkerDTO.UpdateWorkerProfileRequest;
import com.gajraj.worker.dto.userDTO.SaveUserReq;
import com.gajraj.worker.service.workerService.InternalWorkerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RequestMapping("internal")
@RestController
public class InternalWorkerController {

    @Autowired
    InternalWorkerService internalService;

    @PostMapping("saveNewUser")
    public ResponseEntity<?> saveNewUser(@RequestBody SaveUserReq saveUserReq) {

        return internalService.saveNewUser(saveUserReq);
    }


    @PostMapping("updateWorker/{workerId}")
    public ResponseEntity<?> updateWorker(@PathVariable String  workerId, @RequestBody UpdateWorkerProfileRequest workerProfileRequest) {
        System.out.println(workerProfileRequest);
        return internalService.updateWorker(workerId, workerProfileRequest);
    }

}
