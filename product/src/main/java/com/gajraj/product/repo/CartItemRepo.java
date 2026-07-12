package com.gajraj.product.repo;

import com.gajraj.product.model.Cart;
import com.gajraj.product.model.CartItem;
import com.gajraj.product.model.Products;
import com.gajraj.product.model.ProductVariants;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CartItemRepo extends JpaRepository<CartItem, UUID> {
    List<CartItem> findByCartOrderByCreatedAtDesc(Cart cart);
    Optional<CartItem> findByCartAndProductAndVariant(Cart cart, Products product, ProductVariants variant);
    List<CartItem> findByCartAndProductAndItemType(Cart cart, Products product, CartItem.ItemType itemType);
    int countByCart(Cart cart);
}
