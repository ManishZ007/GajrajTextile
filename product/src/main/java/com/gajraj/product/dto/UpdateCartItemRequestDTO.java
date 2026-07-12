package com.gajraj.product.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UpdateCartItemRequestDTO {
    private String action;  // SET, INCREASE, DECREASE
    private Integer quantity;
}
