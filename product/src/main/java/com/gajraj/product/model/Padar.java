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
@Table(name = "padar")
public class Padar {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "padar_id")
    private UUID padarId;

    @Column(name = "padar_name", nullable = false)
    private String padarName;              // e.g. "Peacock Padar"

    @Column(name = "model_url", nullable = false)
    private String modelUrl;              // e.g. "padars/fancy/peacock.glb"

    @ManyToOne
    @JoinColumn(name = "category_id", nullable = false)
    private ProductCategories category;            // which category owns this padar

    @Column(name = "created_at", columnDefinition = "TIMESTAMP DEFAULT NOW()")
    @CreationTimestamp
    private LocalDateTime createdAt;

    @Column(name = "updated_at", columnDefinition = "TIMESTAMP DEFAULT NOW()")
    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
