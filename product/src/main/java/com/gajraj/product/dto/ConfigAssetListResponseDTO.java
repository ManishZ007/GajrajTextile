package com.gajraj.product.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ConfigAssetListResponseDTO {
    private List<ConfigAssetResponseDTO> content;
    private long totalElements;
    private int totalPages;
    private int currentPage;
    private int pageSize;

    private long totalAssets;
    private long textureCount;
    private long modelCount;
    private long previewCount;
    private long padarCount;
    private long kinarCount;
    private long buttiCount;
    private long zariCount;
    private long gondCount;
    private long baseModelCount;
}
