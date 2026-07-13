package com.gajraj.manager.dto.supportDTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SupportCaseListDTO {
    private List<SupportCaseResponseDTO> content;
    private long totalElements;
    private int totalPages;
    private int currentPage;
    private int pageSize;

    private long totalCases;
    private long openCount;
    private long inProgressCount;
    private long resolvedCount;
}
