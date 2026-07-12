package com.gajraj.product.service;

import com.gajraj.product.dto.CategoryRequestDTO;
import com.gajraj.product.dto.CategoryResponseDTO;
import com.gajraj.product.model.ProductCategories;
import com.gajraj.product.repo.ProductCategoriesRepo;
import com.gajraj.product.repo.ProductsRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
public class ProductCategoriesService {

    @Autowired
    private ProductCategoriesRepo productCategoriesRepo;

    @Autowired
    private ProductsRepo productsRepo;

    @Autowired
    private S3Service s3Service;

    private CategoryResponseDTO toDTO(ProductCategories c) {
        return new CategoryResponseDTO(
                c.getCategoryId(),
                c.getName(),
                c.getDescription(),
                c.getBaseModelUrl(),
                c.getBaseImage() != null ? s3Service.generateViewUrl(c.getBaseImage()) : null,
                c.getBaseTitle(),
                c.getBaseDescription(),
                c.getBaseShortDescription(),
                c.getCustomizable(),
                c.getCreatedAt(),
                productsRepo.countByCategory(c)
        );
    }

    @Transactional(readOnly = true)
    public List<CategoryResponseDTO> getAllCategories() {
        return productCategoriesRepo.findAll().stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional
    public ProductCategories createCategory(CategoryRequestDTO dto) {
        if (dto.getName() == null || dto.getName().isBlank()) {
            throw new IllegalArgumentException("Category name is required");
        }
        productCategoriesRepo.findByNameIgnoreCase(dto.getName().trim()).ifPresent(existing -> {
            throw new IllegalStateException("Category with name '" + dto.getName() + "' already exists");
        });

        ProductCategories category = new ProductCategories();
        category.setName(dto.getName().trim());
        category.setDescription(dto.getDescription());
        if (dto.getBaseModelUrl() != null) category.setBaseModelUrl(dto.getBaseModelUrl());
        if (dto.getBaseTitle() != null) category.setBaseTitle(dto.getBaseTitle());
        if (dto.getBaseDescription() != null) category.setBaseDescription(dto.getBaseDescription());
        if (dto.getBaseShortDescription() != null) category.setBaseShortDescription(dto.getBaseShortDescription());
        if (dto.getCustomizable() != null) category.setCustomizable(dto.getCustomizable());
        return productCategoriesRepo.save(category);
    }

    @Transactional
    public ProductCategories updateCategory(UUID categoryId, CategoryRequestDTO dto) {
        ProductCategories category = productCategoriesRepo.findById(categoryId)
                .orElseThrow(() -> new NoSuchElementException("Category not found: " + categoryId));

        if (dto.getName() == null || dto.getName().isBlank()) {
            throw new IllegalArgumentException("Category name is required");
        }
        productCategoriesRepo.findByNameIgnoreCaseAndCategoryIdNot(dto.getName().trim(), categoryId)
                .ifPresent(existing -> {
                    throw new IllegalStateException("Category with name '" + dto.getName() + "' already exists");
                });

        category.setName(dto.getName().trim());
        category.setDescription(dto.getDescription());
        if (dto.getBaseModelUrl() != null) category.setBaseModelUrl(dto.getBaseModelUrl());
        if (dto.getBaseTitle() != null) category.setBaseTitle(dto.getBaseTitle());
        if (dto.getBaseDescription() != null) category.setBaseDescription(dto.getBaseDescription());
        if (dto.getBaseShortDescription() != null) category.setBaseShortDescription(dto.getBaseShortDescription());
        if (dto.getCustomizable() != null) category.setCustomizable(dto.getCustomizable());
        return productCategoriesRepo.save(category);
    }

    @Transactional
    public Map<String, String> getCategoryBaseImageUploadUrl(UUID categoryId, String fileName) {
        productCategoriesRepo.findById(categoryId)
                .orElseThrow(() -> new NoSuchElementException("Category not found: " + categoryId));
        return s3Service.generateUploadUrl("category-images", fileName);
    }

    @Transactional
    public CategoryResponseDTO setBaseImage(UUID categoryId, String s3Key) {
        ProductCategories category = productCategoriesRepo.findById(categoryId)
                .orElseThrow(() -> new NoSuchElementException("Category not found: " + categoryId));
        category.setBaseImage(s3Key);
        return toDTO(productCategoriesRepo.save(category));
    }

    @Transactional
    public CategoryResponseDTO deleteBaseImage(UUID categoryId) {
        ProductCategories category = productCategoriesRepo.findById(categoryId)
                .orElseThrow(() -> new NoSuchElementException("Category not found: " + categoryId));
        category.setBaseImage(null);
        return toDTO(productCategoriesRepo.save(category));
    }

    @Transactional
    public CategoryResponseDTO setBaseContent(UUID categoryId, String baseTitle, String baseDescription, String baseShortDescription) {
        ProductCategories category = productCategoriesRepo.findById(categoryId)
                .orElseThrow(() -> new NoSuchElementException("Category not found: " + categoryId));
        if (baseTitle != null) category.setBaseTitle(baseTitle);
        if (baseDescription != null) category.setBaseDescription(baseDescription);
        if (baseShortDescription != null) category.setBaseShortDescription(baseShortDescription);
        return toDTO(productCategoriesRepo.save(category));
    }

    @Transactional
    public ProductCategories setBaseModelUrl(UUID categoryId, String baseModelUrl) {
        ProductCategories category = productCategoriesRepo.findById(categoryId)
                .orElseThrow(() -> new NoSuchElementException("Category not found: " + categoryId));
        category.setBaseModelUrl(baseModelUrl);
        return productCategoriesRepo.save(category);
    }

    @Transactional
    public ProductCategories setCustomizable(UUID categoryId, Boolean customizable) {
        ProductCategories category = productCategoriesRepo.findById(categoryId)
                .orElseThrow(() -> new NoSuchElementException("Category not found: " + categoryId));
        category.setCustomizable(customizable);
        return productCategoriesRepo.save(category);
    }

    @Transactional
    public void deleteCategory(UUID categoryId) {
        ProductCategories category = productCategoriesRepo.findById(categoryId)
                .orElseThrow(() -> new NoSuchElementException("Category not found: " + categoryId));

        int productCount = productsRepo.countByCategory(category);
        if (productCount > 0) {
            throw new IllegalArgumentException(
                    "Cannot delete category with existing products. Move or delete the products first."
            );
        }
        productCategoriesRepo.delete(category);
    }
}
