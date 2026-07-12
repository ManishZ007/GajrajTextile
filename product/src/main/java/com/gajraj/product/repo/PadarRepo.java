package com.gajraj.product.repo;

import com.gajraj.product.model.Padar;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PadarRepo extends JpaRepository<Padar, UUID> {
    List<Padar> findByCategoryCategoryId(UUID categoryId);
}
