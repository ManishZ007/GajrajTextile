package com.gajraj.product.repo;

import com.gajraj.product.model.ProductCategories;
import com.gajraj.product.model.Products;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.UUID;

public interface ProductsRepo extends JpaRepository<Products, UUID>, JpaSpecificationExecutor<Products> {

    int countByCategory(ProductCategories category);
}
