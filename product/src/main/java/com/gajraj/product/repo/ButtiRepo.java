package com.gajraj.product.repo;

import com.gajraj.product.model.Butti;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ButtiRepo extends JpaRepository<Butti, UUID> {
    List<Butti> findByCategoryCategoryId(UUID categoryId);
}
