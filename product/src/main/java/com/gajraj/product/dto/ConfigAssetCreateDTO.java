package com.gajraj.product.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ConfigAssetCreateDTO {
    private String name;
    private String assetType;
    private String category;
    private String s3Key;
    private String fileExtension;
    private Long fileSizeBytes;
    private String description;
}
