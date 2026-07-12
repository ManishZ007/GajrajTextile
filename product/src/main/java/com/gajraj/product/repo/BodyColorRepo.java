package com.gajraj.product.repo;

import com.gajraj.product.model.BodyColor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface BodyColorRepo extends JpaRepository<BodyColor, UUID> {
    List<BodyColor> findByCategoryCategoryId(UUID categoryId);
}
