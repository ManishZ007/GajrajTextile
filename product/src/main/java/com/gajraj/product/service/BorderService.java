package com.gajraj.product.service;

import com.gajraj.product.dto.BorderResponseDTO;
import com.gajraj.product.dto.ModelUrlEntityRequestDTO;
import com.gajraj.product.model.Border;
import com.gajraj.product.model.ProductCategories;
import com.gajraj.product.repo.BorderRepo;
import com.gajraj.product.repo.ProductCategoriesRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
public class BorderService {

    @Autowired
    private BorderRepo borderRepo;

    @Autowired
    private ProductCategoriesRepo productCategoriesRepo;

    @Transactional
    public BorderResponseDTO create(ModelUrlEntityRequestDTO dto) {
        if (dto.getName() == null || dto.getName().isBlank())
            throw new IllegalArgumentException("name is required");
        if (dto.getModelUrl() == null || dto.getModelUrl().isBlank())
            throw new IllegalArgumentException("modelUrl is required");

        ProductCategories category = productCategoriesRepo.findById(dto.getCategoryId())
                .orElseThrow(() -> new NoSuchElementException("Category not found: " + dto.getCategoryId()));

        Border border = new Border();
        border.setBorderName(dto.getName());
        border.setModelUrl(dto.getModelUrl());
        border.setCategory(category);
        return toDTO(borderRepo.save(border));
    }

    @Transactional(readOnly = true)
    public List<BorderResponseDTO> getAll() {
        return borderRepo.findAll().stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public BorderResponseDTO getById(UUID id) {
        return toDTO(borderRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Border not found: " + id)));
    }

    @Transactional(readOnly = true)
    public List<BorderResponseDTO> getByCategoryId(UUID categoryId) {
        return borderRepo.findByCategoryCategoryId(categoryId).stream().map(this::toDTO).toList();
    }

    @Transactional
    public BorderResponseDTO update(UUID id, ModelUrlEntityRequestDTO dto) {
        Border border = borderRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Border not found: " + id));

        if (dto.getName() != null && !dto.getName().isBlank())
            border.setBorderName(dto.getName());
        if (dto.getModelUrl() != null && !dto.getModelUrl().isBlank())
            border.setModelUrl(dto.getModelUrl());
        if (dto.getCategoryId() != null) {
            ProductCategories category = productCategoriesRepo.findById(dto.getCategoryId())
                    .orElseThrow(() -> new NoSuchElementException("Category not found: " + dto.getCategoryId()));
            border.setCategory(category);
        }
        return toDTO(borderRepo.save(border));
    }

    @Transactional
    public void delete(UUID id) {
        if (!borderRepo.existsById(id))
            throw new NoSuchElementException("Border not found: " + id);
        borderRepo.deleteById(id);
    }

    private BorderResponseDTO toDTO(Border b) {
        return new BorderResponseDTO(
                b.getBorderId(),
                b.getBorderName(),
                b.getModelUrl(),
                b.getCategory().getCategoryId(),
                b.getCategory().getName(),
                b.getCreatedAt(),
                b.getUpdatedAt()
        );
    }
}
