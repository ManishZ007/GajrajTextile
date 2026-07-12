package com.gajraj.manager.dto.supportDTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SupportCaseCreateDTO {
    private String orderId;
    private String customerId;
    private String issueType;
    private String description;
    private String handledBy;
}
