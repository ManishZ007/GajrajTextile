package com.gajraj.product.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ColorEntityRequestDTO {
    private String name;
    private String hexCode;
    private UUID categoryId;
}
