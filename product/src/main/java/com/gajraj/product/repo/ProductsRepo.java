package com.gajraj.product.repo;

import com.gajraj.product.model.ProductCategories;
import com.gajraj.product.model.Products;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.UUID;

public interface ProductsRepo extends JpaRepository<Products, UUID>, JpaSpecificationExecutor<Products> {

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select p from Products p where p.productId = :id")
    java.util.Optional<Products> lockForPrice(@org.springframework.data.repository.query.Param("id") UUID id);

    int countByCategory(ProductCategories category);
}
