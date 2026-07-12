package com.gajraj.product.repo;

import com.gajraj.product.model.Cart;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CartRepo extends JpaRepository<Cart, UUID> {
    Optional<Cart> findByCustomerId(UUID customerId);
}
