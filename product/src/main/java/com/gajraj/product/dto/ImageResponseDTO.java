package com.gajraj.product.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ImageResponseDTO {

    private UUID imageId;
    private String productName;
    private UUID productId;
    private String categoryName;
    private String imageUrl;
    private String s3Key;
    private boolean isPrimary;
    private int displayOrder;
    private LocalDateTime createdAt;
}
