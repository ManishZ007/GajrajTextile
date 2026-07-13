package com.gajraj.worker.dto.WorkerDTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UpdateWorkerInDataBase {
    private int worker_experience;
    private String worker_profile_image; // diff api request for changing
    private LocalDateTime updatedAt;
    private String gender;
    private LocalDate date_of_birth;
}
