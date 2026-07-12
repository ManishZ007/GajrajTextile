package com.gajraj.product.service;

import com.gajraj.product.dto.ImageResponseDTO;
import com.gajraj.product.dto.ProductCreateRequestDTO;
import com.gajraj.product.model.ProductImages;
import com.gajraj.product.model.Products;
import com.gajraj.product.repo.ProductImagesRepo;
import com.gajraj.product.repo.ProductsRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
public class ProductImagesService {

    @Autowired
    private ProductImagesRepo productImagesRepo;

    @Autowired
    private ProductsRepo productsRepo;

    @Autowired
    private S3Service s3Service;

    @Transactional(readOnly = true)
    public Map<String, Object> getAllImages(int page, int size, UUID productId, Boolean primaryOnly) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createAt"));

        Specification<ProductImages> spec = (root, query, cb) -> cb.conjunction();

        if (productId != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("product").get("productId"), productId));
        }
        if (Boolean.TRUE.equals(primaryOnly)) {
            spec = spec.and((root, query, cb) ->
                    cb.isTrue(root.get("isPrimary")));
        }

        Page<ProductImages> imagePage = productImagesRepo.findAll(spec, pageable);

        List<ImageResponseDTO> content = imagePage.getContent().stream()
                .map(this::toDTO)
                .toList();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("content", content);
        response.put("totalElements", imagePage.getTotalElements());
        response.put("totalPages", imagePage.getTotalPages());
        response.put("currentPage", page);
        response.put("pageSize", size);
        return response;
    }

    @Transactional
    public ImageResponseDTO setPrimary(UUID imageId) {
        ProductImages target = productImagesRepo.findById(imageId)
                .orElseThrow(() -> new NoSuchElementException("Image not found: " + imageId));

        List<ProductImages> currentPrimaries = productImagesRepo.findAllByProductAndIsPrimaryTrue(target.getProduct());
        for (ProductImages img : currentPrimaries) {
            if (!img.getImageId().equals(imageId)) {
                img.setIsPrimary(false);
                productImagesRepo.save(img);
            }
        }

        target.setIsPrimary(true);
        return toDTO(productImagesRepo.save(target));
    }

    @Transactional
    public ImageResponseDTO reorderImage(UUID imageId, int newOrder) {
        ProductImages image = productImagesRepo.findById(imageId)
                .orElseThrow(() -> new NoSuchElementException("Image not found: " + imageId));

        image.setDisplayOrder(newOrder);
        return toDTO(productImagesRepo.save(image));
    }

    @Transactional
    public void deleteImage(UUID imageId) {
        ProductImages image = productImagesRepo.findById(imageId)
                .orElseThrow(() -> new NoSuchElementException("Image not found: " + imageId));

        boolean wasPrimary = Boolean.TRUE.equals(image.getIsPrimary());
        Products product = image.getProduct();

        productImagesRepo.delete(image);
        productImagesRepo.flush();

        if (wasPrimary) {
            List<ProductImages> remaining = productImagesRepo.findByProductOrderByDisplayOrderAsc(product);
            if (!remaining.isEmpty()) {
                remaining.get(0).setIsPrimary(true);
                productImagesRepo.save(remaining.get(0));
            }
        }
    }

    @Transactional
    public List<ImageResponseDTO> addImages(UUID productId, List<ProductCreateRequestDTO.ImageRequest> images) {
        Products product = productsRepo.findById(productId)
                .orElseThrow(() -> new NoSuchElementException("Product not found: " + productId));

        boolean noExistingImages = productImagesRepo.findByProductOrderByDisplayOrderAsc(product).isEmpty();

        List<ImageResponseDTO> saved = new ArrayList<>();
        for (int i = 0; i < images.size(); i++) {
            ProductCreateRequestDTO.ImageRequest req = images.get(i);
            ProductImages image = new ProductImages();
            image.setProduct(product);
            image.setImageUrl(req.getImageUrl());
            image.setDisplayOrder(req.getDisplayOrder() != null ? req.getDisplayOrder() : i);
            // auto-set first image as primary only when product had no images before
            boolean autoPrimary = noExistingImages && i == 0;
            image.setIsPrimary(Boolean.TRUE.equals(req.getIsPrimary()) || autoPrimary);
            saved.add(toDTO(productImagesRepo.save(image)));
        }

        return saved;
    }

    private ImageResponseDTO toDTO(ProductImages img) {
        String key = img.getImageUrl();
        return new ImageResponseDTO(
                img.getImageId(),
                img.getProduct().getName(),
                img.getProduct().getProductId(),
                img.getProduct().getCategory().getName(),
                s3Service.generateViewUrl(key),
                key,
                Boolean.TRUE.equals(img.getIsPrimary()),
                img.getDisplayOrder() != null ? img.getDisplayOrder() : 0,
                img.getCreateAt()
        );
    }
}
