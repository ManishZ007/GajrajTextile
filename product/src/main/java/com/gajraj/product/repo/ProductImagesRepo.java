package com.gajraj.product.repo;

import com.gajraj.product.model.ProductImages;
import com.gajraj.product.model.Products;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductImagesRepo extends JpaRepository<ProductImages, UUID>, JpaSpecificationExecutor<ProductImages> {

    Optional<ProductImages> findByProductAndIsPrimaryTrue(Products product);

    List<ProductImages> findAllByProductAndIsPrimaryTrue(Products product);

    List<ProductImages> findByProductOrderByDisplayOrderAsc(Products product);

    void deleteAllByProduct(Products product);
}
