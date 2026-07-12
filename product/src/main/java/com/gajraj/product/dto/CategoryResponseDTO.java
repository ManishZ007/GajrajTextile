package com.gajraj.product.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CategoryResponseDTO {

    private UUID categoryId;
    private String name;
    private String description;
    private String baseModelUrl;
    private String baseImageUrl;
    private String baseTitle;
    private String baseDescription;
    private String baseShortDescription;
    private Boolean customizable;
    private LocalDateTime createdAt;
    private int productCount;
}
