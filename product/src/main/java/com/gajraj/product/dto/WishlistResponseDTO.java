package com.gajraj.product.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class WishlistResponseDTO {

    private UUID wishlistId;
    private UUID customerId;
    private LocalDateTime addedAt;

    private UUID productId;
    private String productName;
    private String productDescription;
    private BigDecimal basePrice;
    private String productStatus;
    private String primaryImageUrl;

    private UUID categoryId;
    private String categoryName;
}
