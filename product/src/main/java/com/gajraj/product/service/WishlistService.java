package com.gajraj.product.service;

import com.gajraj.product.dto.WishlistResponseDTO;
import com.gajraj.product.model.Products;
import com.gajraj.product.model.Wishlist;
import com.gajraj.product.repo.ProductImagesRepo;
import com.gajraj.product.repo.ProductsRepo;
import com.gajraj.product.repo.WishlistRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
public class WishlistService {

    @Autowired
    private WishlistRepo wishlistRepo;

    @Autowired
    private ProductsRepo productsRepo;

    @Autowired
    private ProductImagesRepo productImagesRepo;






    @Autowired
    private S3Service s3Service;

    private WishlistResponseDTO toDTO(Wishlist w) {
        Products p = w.getProduct();
        String primaryImageUrl = productImagesRepo.findByProductAndIsPrimaryTrue(p)
                .map(img -> s3Service.generateViewUrl(img.getImageUrl()))
                .orElse(null);
        return new WishlistResponseDTO(
                w.getWishlistId(),
                w.getCustomerId(),
                w.getCreatedAt(),
                p.getProductId(),
                p.getName(),
                p.getDescription(),
                p.getBasePrice(),
                p.getStatus(),
                primaryImageUrl,
                p.getCategory().getCategoryId(),
                p.getCategory().getName()
        );
    }

    @Transactional
    public WishlistResponseDTO addToWishlist(UUID customerId, UUID productId) {
        if (wishlistRepo.existsByCustomerIdAndProductProductId(customerId, productId)) {
            throw new IllegalStateException("Product already in wishlist");
        }
        Products product = productsRepo.findById(productId)
                .orElseThrow(() -> new NoSuchElementException("Product not found: " + productId));

        Wishlist wishlist = new Wishlist();
        wishlist.setCustomerId(customerId);
        wishlist.setProduct(product);
        return toDTO(wishlistRepo.save(wishlist));
    }

    @Transactional(readOnly = true)
    public List<WishlistResponseDTO> getWishlist(UUID customerId) {
        return wishlistRepo.findByCustomerIdOrderByCreatedAtDesc(customerId)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> checkWishlist(UUID customerId, UUID productId) {
        boolean exists = wishlistRepo.existsByCustomerIdAndProductProductId(customerId, productId);
        return Map.of("inWishlist", exists);
    }

    @Transactional
    public void removeByWishlistId(UUID wishlistId) {
        if (!wishlistRepo.existsById(wishlistId)) {
            throw new NoSuchElementException("Wishlist item not found: " + wishlistId);
        }
        wishlistRepo.deleteById(wishlistId);
    }

    @Transactional
    public void removeByProduct(UUID customerId, UUID productId) {
        if (!wishlistRepo.existsByCustomerIdAndProductProductId(customerId, productId)) {
            throw new NoSuchElementException("Product not found in wishlist");
        }
        wishlistRepo.deleteByCustomerIdAndProductProductId(customerId, productId);
    }

    @Transactional
    public void clearWishlist(UUID customerId) {
        List<Wishlist> items = wishlistRepo.findByCustomerIdOrderByCreatedAtDesc(customerId);
        wishlistRepo.deleteAll(items);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getWishlistCount(UUID customerId) {
        return Map.of("count", wishlistRepo.countByCustomerId(customerId));
    }
}
