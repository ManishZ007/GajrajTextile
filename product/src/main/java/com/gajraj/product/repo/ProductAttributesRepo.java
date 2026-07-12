package com.gajraj.product.repo;

import com.gajraj.product.model.ProductAttributes;
import com.gajraj.product.model.Products;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ProductAttributesRepo extends JpaRepository<ProductAttributes, UUID> {

    void deleteAllByProduct(Products product);
}
