package com.gajraj.product.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "border_colors")
public class BorderColor {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "border_color_id")
    private UUID borderColorId;

    @Column(name = "color_name", nullable = false)
    private String colorName;           // e.g. "Gold"

    @Column(name = "hex_code", nullable = false)
    private String hexCode;            // e.g. "#D4AF37"

    @ManyToOne
    @JoinColumn(name = "category_id", nullable = false)
    private ProductCategories category;

    @CreationTimestamp
    @Column(name = "created_at", columnDefinition = "TIMESTAMP DEFAULT NOW()")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", columnDefinition = "TIMESTAMP DEFAULT NOW()")
    private LocalDateTime updatedAt;
}