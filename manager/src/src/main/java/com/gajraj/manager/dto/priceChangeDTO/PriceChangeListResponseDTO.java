package com.gajraj.manager.dto.priceChangeDTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PriceChangeListResponseDTO {
    private List<PriceChangeResponseDTO> content;
    private long totalElements;
    private int totalPages;
    private int currentPage;
    private int pageSize;

    private long totalRequests;
    private long pendingCount;
    private long approvedCount;
    private long rejectedCount;
}
