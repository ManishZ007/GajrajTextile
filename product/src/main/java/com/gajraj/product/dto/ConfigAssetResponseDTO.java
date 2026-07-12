package com.gajraj.product.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ConfigAssetResponseDTO {
    private UUID assetId;
    private String name;
    private String assetType;
    private String category;
    private String viewUrl;
    private String s3Key;
    private String fileExtension;
    private Long fileSizeBytes;
    private String description;
    private Boolean isActive;
    private LocalDateTime createdAt;
}
