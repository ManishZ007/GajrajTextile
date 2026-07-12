package com.gajraj.product.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class VariantUpdateDTO {

    private BigDecimal price;
    private Integer stockQuantity;
    private String status;
    private String size;
    private String color;
    private String sku;
}
