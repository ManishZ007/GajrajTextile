package com.gajraj.product.service;

import com.gajraj.product.dto.BodyColorResponseDTO;
import com.gajraj.product.dto.ColorEntityRequestDTO;
import com.gajraj.product.model.BodyColor;
import com.gajraj.product.model.ProductCategories;
import com.gajraj.product.repo.BodyColorRepo;
import com.gajraj.product.repo.ProductCategoriesRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
public class BodyColorService {

    @Autowired
    private BodyColorRepo bodyColorRepo;

    @Autowired
    private ProductCategoriesRepo productCategoriesRepo;

    @Transactional
    public BodyColorResponseDTO create(ColorEntityRequestDTO dto) {
        if (dto.getName() == null || dto.getName().isBlank())
            throw new IllegalArgumentException("name is required");
        if (dto.getHexCode() == null || dto.getHexCode().isBlank())
            throw new IllegalArgumentException("hexCode is required");

        ProductCategories category = productCategoriesRepo.findById(dto.getCategoryId())
                .orElseThrow(() -> new NoSuchElementException("Category not found: " + dto.getCategoryId()));

        BodyColor bodyColor = new BodyColor();
        bodyColor.setColorName(dto.getName());
        bodyColor.setHexCode(dto.getHexCode());
        bodyColor.setCategory(category);
        return toDTO(bodyColorRepo.save(bodyColor));
    }

    @Transactional(readOnly = true)
    public List<BodyColorResponseDTO> getAll() {
        return bodyColorRepo.findAll().stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public BodyColorResponseDTO getById(UUID id) {
        return toDTO(bodyColorRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("BodyColor not found: " + id)));
    }

    @Transactional(readOnly = true)
    public List<BodyColorResponseDTO> getByCategoryId(UUID categoryId) {
        return bodyColorRepo.findByCategoryCategoryId(categoryId).stream().map(this::toDTO).toList();
    }

    @Transactional
    public BodyColorResponseDTO update(UUID id, ColorEntityRequestDTO dto) {
        BodyColor bodyColor = bodyColorRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("BodyColor not found: " + id));

        if (dto.getName() != null && !dto.getName().isBlank())
            bodyColor.setColorName(dto.getName());
        if (dto.getHexCode() != null && !dto.getHexCode().isBlank())
            bodyColor.setHexCode(dto.getHexCode());
        if (dto.getCategoryId() != null) {
            ProductCategories category = productCategoriesRepo.findById(dto.getCategoryId())
                    .orElseThrow(() -> new NoSuchElementException("Category not found: " + dto.getCategoryId()));
            bodyColor.setCategory(category);
        }
        return toDTO(bodyColorRepo.save(bodyColor));
    }

    @Transactional
    public void delete(UUID id) {
        if (!bodyColorRepo.existsById(id))
            throw new NoSuchElementException("BodyColor not found: " + id);
        bodyColorRepo.deleteById(id);
    }

    private BodyColorResponseDTO toDTO(BodyColor b) {
        return new BodyColorResponseDTO(
                b.getBodyColorId(),
                b.getColorName(),
                b.getHexCode(),
                b.getCategory().getCategoryId(),
                b.getCategory().getName(),
                b.getCreatedAt(),
                b.getUpdatedAt()
        );
    }
}
