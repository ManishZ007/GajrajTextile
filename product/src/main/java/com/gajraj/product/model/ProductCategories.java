package com.gajraj.product.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@ToString
@Entity
@Table(name = "product_categories")
public class ProductCategories {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "category_id")
    private UUID categoryId;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "base_model_url")
    private String baseModelUrl;

    @Column(name = "base_image")
    private String baseImage;

    @Column(name = "base_title", length = 200)
    private String baseTitle;

    @Column(name = "base_description", columnDefinition = "TEXT")
    private String baseDescription;

    @Column(name = "base_short_description", length = 500)
    private String baseShortDescription;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "customizable", columnDefinition = "BOOLEAN")
    private Boolean customizable = false;

    @Column(name = "created_at", columnDefinition = "TIMESTAMP DEFAULT NOW()")
    @CreationTimestamp
    private LocalDateTime createdAt;

    @Column(name = "updated_at", columnDefinition = "TIMESTAMP DEFAULT NOW()")
    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "category")
    @JsonIgnore
    private List<Products> products;

    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL)
    @JsonIgnore
    private  List<Padar> padars;

    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL)
    @JsonIgnore
    private  List<Border> borders;

    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL)
    @JsonIgnore
    private  List<Butti> buttis;

    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL)
    @JsonIgnore
    private  List<BodyColor> bodyColors;

    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL)
    @JsonIgnore
    private  List<BorderColor> borderColors;

}
