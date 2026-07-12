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
@Table(name = "buttis")
public class Butti {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "butti_id")
    private UUID buttiId;

    @Column(name = "butti_name", nullable = false)
    private String buttiName;            // e.g. "Mor Butti"

    @Column(name = "model_url", nullable = false)
    private String modelUrl;            // e.g. "buttis/fancy/mor.glb"

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