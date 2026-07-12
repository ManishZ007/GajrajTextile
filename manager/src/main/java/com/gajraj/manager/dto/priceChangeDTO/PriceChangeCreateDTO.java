package com.gajraj.manager.dto.priceChangeDTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PriceChangeCreateDTO {
    private String productId;
    private BigDecimal oldPrice;
    private BigDecimal newPrice;
    private String reason;
    private String updatedBy;
}
