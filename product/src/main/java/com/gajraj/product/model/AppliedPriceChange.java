package com.gajraj.product.model;
import jakarta.persistence.*;
import lombok.Data;
import java.util.UUID;
import java.math.BigDecimal;
@Entity @Data
public class AppliedPriceChange {
 @Id private UUID id;
 private UUID productId;
 @Column(precision=10,scale=2) private BigDecimal oldPrice;
 @Column(precision=10,scale=2) private BigDecimal newPrice;
}
