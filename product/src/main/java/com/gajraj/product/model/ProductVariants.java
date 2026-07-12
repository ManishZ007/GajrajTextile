package com.gajraj.product.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@ToString
@Entity
@Table(name = "product_variants")
public class ProductVariants {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "variant_id")
    private UUID variantId;


    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    private Products product;

    @Column(name = "size")
    private String size;


    @Column(name = "color")
    private String color;

    @Column(name="price", nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "stock_quantity", nullable = false)
    private Integer stockQuantity;

    @Column(name = "sku", unique = true)
    private String sku;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "created_at", columnDefinition = "TIMESTAMP DEFAULT NOW()")
    @CreationTimestamp
    private LocalDateTime createdAt;

}
