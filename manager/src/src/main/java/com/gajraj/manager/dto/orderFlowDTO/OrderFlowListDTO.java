package com.gajraj.manager.dto.orderFlowDTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrderFlowListDTO {
    private List<OrderFlowResponseDTO> content;
    private long totalElements;
    private int totalPages;
    private int currentPage;
    private int pageSize;

    private long totalOrders;
    private long notStartedCount;
    private long inProgressCount;
    private long completedCount;
    private long qcPendingCount;
    private long qcApprovedCount;
    private long qcRejectedCount;
    private long readyForShippingCount;
    private long shippedCount;
}
