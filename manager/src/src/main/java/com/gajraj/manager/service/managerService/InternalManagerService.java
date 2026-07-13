package com.gajraj.manager.service.managerService;


import com.gajraj.manager.dto.userDTO.SaveUserDTO;
import com.gajraj.manager.model.Managers;
import com.gajraj.manager.repo.ManagerRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class InternalManagerService {

    @Autowired
    ManagerRepo managerRepo;

    public ResponseEntity<?> saveNewUser(SaveUserDTO saveUserDTO) {

        try {
            Managers newUserData = new Managers();

            newUserData.setUserId(saveUserDTO.getUser_id());

            Managers saveManager = managerRepo.save(newUserData);

            if(saveManager != null) {
                return ResponseEntity.ok(Map.of(
                        "message", "manager created successfully",
                        "manager", saveManager

                ));
            } else return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    Map.of(
                            "message", "something wrong happen in manager database"
                    )
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("something went wrong " + e.getMessage());
        }


    }

}
