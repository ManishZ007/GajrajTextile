package com.gajraj.worker.dto.WorkerDTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UpdateWorkerProfileRequest {
    private int worker_experience;
    private String worker_profile_image;
    private String date_of_birth;
    private String gender;
}
