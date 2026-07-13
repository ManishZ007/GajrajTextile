package com.gajraj.authentication.dto.update_user.updateWorker;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Data
@AllArgsConstructor
@NoArgsConstructor
@ToString
public class UpdateWorkerDTO {
    private int worker_experience;
    private String worker_profile_image;
    private String date_of_birth;
    private String gender;
}
