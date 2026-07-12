package com.gajraj.product.repo;

import com.gajraj.product.model.ProductCategories;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ProductCategoriesRepo extends JpaRepository<ProductCategories, UUID> {

    Optional<ProductCategories> findByNameIgnoreCase(String name);

    Optional<ProductCategories> findByNameIgnoreCaseAndCategoryIdNot(String name, UUID categoryId);
}
