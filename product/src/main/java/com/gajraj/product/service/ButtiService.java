package com.gajraj.product.service;

import com.gajraj.product.dto.ButtiResponseDTO;
import com.gajraj.product.dto.ModelUrlEntityRequestDTO;
import com.gajraj.product.model.Butti;
import com.gajraj.product.model.ProductCategories;
import com.gajraj.product.repo.ButtiRepo;
import com.gajraj.product.repo.ProductCategoriesRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
public class ButtiService {

    @Autowired
    private ButtiRepo buttiRepo;

    @Autowired
    private ProductCategoriesRepo productCategoriesRepo;

    @Transactional
    public ButtiResponseDTO create(ModelUrlEntityRequestDTO dto) {
        if (dto.getName() == null || dto.getName().isBlank())
            throw new IllegalArgumentException("name is required");
        if (dto.getModelUrl() == null || dto.getModelUrl().isBlank())
            throw new IllegalArgumentException("modelUrl is required");

        ProductCategories category = productCategoriesRepo.findById(dto.getCategoryId())
                .orElseThrow(() -> new NoSuchElementException("Category not found: " + dto.getCategoryId()));

        Butti butti = new Butti();
        butti.setButtiName(dto.getName());
        butti.setModelUrl(dto.getModelUrl());
        butti.setCategory(category);
        return toDTO(buttiRepo.save(butti));
    }

    @Transactional(readOnly = true)
    public List<ButtiResponseDTO> getAll() {
        return buttiRepo.findAll().stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public ButtiResponseDTO getById(UUID id) {
        return toDTO(buttiRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Butti not found: " + id)));
    }

    @Transactional(readOnly = true)
    public List<ButtiResponseDTO> getByCategoryId(UUID categoryId) {
        return buttiRepo.findByCategoryCategoryId(categoryId).stream().map(this::toDTO).toList();
    }

    @Transactional
    public ButtiResponseDTO update(UUID id, ModelUrlEntityRequestDTO dto) {
        Butti butti = buttiRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Butti not found: " + id));

        if (dto.getName() != null && !dto.getName().isBlank())
            butti.setButtiName(dto.getName());
        if (dto.getModelUrl() != null && !dto.getModelUrl().isBlank())
            butti.setModelUrl(dto.getModelUrl());
        if (dto.getCategoryId() != null) {
            ProductCategories category = productCategoriesRepo.findById(dto.getCategoryId())
                    .orElseThrow(() -> new NoSuchElementException("Category not found: " + dto.getCategoryId()));
            butti.setCategory(category);
        }
        return toDTO(buttiRepo.save(butti));
    }

    @Transactional
    public void delete(UUID id) {
        if (!buttiRepo.existsById(id))
            throw new NoSuchElementException("Butti not found: " + id);
        buttiRepo.deleteById(id);
    }

    private ButtiResponseDTO toDTO(Butti b) {
        return new ButtiResponseDTO(
                b.getButtiId(),
                b.getButtiName(),
                b.getModelUrl(),
                b.getCategory().getCategoryId(),
                b.getCategory().getName(),
                b.getCreatedAt(),
                b.getUpdatedAt()
        );
    }
}
