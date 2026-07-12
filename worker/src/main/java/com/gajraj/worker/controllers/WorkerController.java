package com.gajraj.worker.controllers;


import com.gajraj.worker.feign.ConnectionInterface;
import com.gajraj.worker.repo.WorkerRepo;
import com.gajraj.worker.service.workerService.WorkerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@RequestMapping("")
@RestController
public class WorkerController {

    @Autowired
    WorkerService workerService;

    @Autowired
    ConnectionInterface authentication;

    @GetMapping("/getWorker")
    public ResponseEntity<?> getWorker() {
        ResponseEntity<Map<String, Object>> authResponse = null;
        ResponseEntity<?> worker = null;
        try{
            String user_id = SecurityContextHolder.getContext().getAuthentication().getPrincipal().toString();
            System.out.println(user_id);
            //auth service
            try {
                authResponse = authentication.userInfo(user_id);
            }catch (Exception e) {
                ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("auth server gives an error " + e.getMessage());
            }

            try{
                worker = workerService.getWorker(user_id);
            }catch (Exception e) {
                ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("worker service gives an error " + e.getMessage());
            }

            if (authResponse == null || authResponse.getBody() == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "auth not found");
            }
            if (worker == null || worker.getBody() == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "worker not found");
            }
            return ResponseEntity.status(HttpStatus.OK).body(Map.of(
                    "worker", worker.getBody(),
                    "authentication", authResponse.getBody()
            ));

        }catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("error :- " + e.getMessage());
        }
    }

}
