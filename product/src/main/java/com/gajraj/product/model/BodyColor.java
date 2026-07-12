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
@Table(name = "body_colors")
public class BodyColor {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "body_color_id")
    private UUID bodyColorId;

    @Column(name = "color_name", nullable = false)
    private String colorName;            // e.g. "Red"

    @Column(name = "hex_code", nullable = false)
    private String hexCode;             // e.g. "#FF0000"

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