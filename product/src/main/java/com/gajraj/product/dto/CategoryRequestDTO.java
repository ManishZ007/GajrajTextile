package com.gajraj.product.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CategoryRequestDTO {

    private String name;
    private String description;
    private String baseModelUrl;
    private String baseTitle;
    private String baseDescription;
    private String baseShortDescription;
    private Boolean customizable;
}
