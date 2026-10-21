package com.gajraj.product.model;

import jakarta.persistence.*;
import lombok.Data;
import java.util.UUID;

@Entity @Data @Table(name="category_studio")
public class CategoryStudio {
    @Id private UUID categoryId;
    @Column(columnDefinition="TEXT",nullable=false) private String modelKey;
    @Column(columnDefinition="TEXT",nullable=false) private String mappingJson;
}
