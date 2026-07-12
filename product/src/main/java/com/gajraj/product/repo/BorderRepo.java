package com.gajraj.product.repo;

import com.gajraj.product.model.Border;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface BorderRepo extends JpaRepository<Border, UUID> {
    List<Border> findByCategoryCategoryId(UUID categoryId);
}
