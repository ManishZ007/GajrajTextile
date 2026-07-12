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
@Table(name = "borders")
public class Border {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "border_id")
    private UUID borderId;

    @Column(name = "border_name", nullable = false)
    private String borderName;            // e.g. "Mor Border"

    @Column(name = "model_url", nullable = false)
    private String modelUrl;             // e.g. "borders/fancy/mor.glb"

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