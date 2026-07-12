package com.gajraj.customer.dto.CustomerDTO;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@ToString
public class CustomerUpdateInDataBase {

    private String gender;
    private LocalDate date_of_birth;
    private String profile_image_url;
    private LocalDateTime updatedAt;
}