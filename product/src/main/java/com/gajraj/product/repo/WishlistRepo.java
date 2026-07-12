package com.gajraj.product.repo;

import com.gajraj.product.model.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WishlistRepo extends JpaRepository<Wishlist, UUID> {
    List<Wishlist> findByCustomerIdOrderByCreatedAtDesc(UUID customerId);
    Optional<Wishlist> findByCustomerIdAndProductProductId(UUID customerId, UUID productId);
    boolean existsByCustomerIdAndProductProductId(UUID customerId, UUID productId);
    void deleteByCustomerIdAndProductProductId(UUID customerId, UUID productId);
    long countByCustomerId(UUID customerId);
}
